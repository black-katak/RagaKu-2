"""Body measurement wrapper (PRD F3).

The underlying model (Human-Body-Measurements-using-Computer-Vision) depends on
TensorFlow 1.13.1, so it is designed to run inside a Docker container. This
module shells out to a configurable command (MEASUREMENT_COMMAND), passing the
uploaded image path and the user's height, then parses the model's stdout.

The model prints lines like:
    height: 170.000000
    waist: 78.123456
    hips: 95.000000
    arm length: 58.0
    shoulder width: 44.0
    chest: 90.0

Privacy (PRD section 7): the uploaded photo is always deleted after processing,
whether the run succeeds or fails. Only the numeric measurements are returned.
"""
from __future__ import annotations

import asyncio
import os
import re
import shlex
import tempfile

from app.config import Settings
from app.schemas import MeasurementResult

# Map the model's label vocabulary (utils.py M_STR) to our schema fields.
_LABEL_MAP = {
    "waist": "waist_cm",
    "hips": "hip_cm",
    "arm length": "arm_length_cm",
    "shoulder width": "shoulder_width_cm",
    "chest": "chest_cm",
}

_LINE_RE = re.compile(r"^\s*([a-zA-Z ]+?)\s*[:=]\s*([-+]?\d*\.?\d+)")


class MeasurementError(Exception):
    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def parse_model_output(stdout: str) -> dict[str, float]:
    """Extract measurement values from model stdout."""
    values: dict[str, float] = {}
    for line in stdout.splitlines():
        m = _LINE_RE.match(line)
        if not m:
            continue
        label = m.group(1).strip().lower()
        if label in _LABEL_MAP:
            try:
                values[_LABEL_MAP[label]] = round(float(m.group(2)), 1)
            except ValueError:
                continue
    return values


def _sanity_warnings(values: dict[str, float]) -> list[str]:
    warnings: list[str] = []
    waist = values.get("waist_cm")
    if waist is not None and not (40 <= waist <= 200):
        warnings.append(
            "Lingkar pinggang di luar rentang wajar; pastikan foto seluruh tubuh "
            "dari depan, pose tegak, dan pakaian tidak longgar."
        )
    if not values:
        warnings.append(
            "Tidak ada ukuran yang terdeteksi. Pastikan pencahayaan baik dan "
            "seluruh tubuh terlihat."
        )
    return warnings


def _confidence(values: dict[str, float], warnings: list[str]) -> str:
    if not values or warnings:
        return "low"
    if len(values) >= 4:
        return "medium"
    return "low"


async def run_measurement(
    settings: Settings, image_bytes: bytes, height_cm: float, suffix: str = ".jpg"
) -> MeasurementResult:
    """Run the CV model on an uploaded image, then delete the image."""
    if not settings.measurement_command:
        raise MeasurementError(
            "Layanan pengukuran belum dikonfigurasi (MEASUREMENT_COMMAND kosong).",
            status_code=503,
        )

    fd, path = tempfile.mkstemp(suffix=suffix, prefix="ragaku_")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(image_bytes)

        # MEASUREMENT_COMMAND is a template with {image} and {height} placeholders.
        cmd_str = settings.measurement_command.format(
            image=shlex.quote(path), height=height_cm
        )
        proc = await asyncio.create_subprocess_shell(
            cmd_str,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout_b, stderr_b = await asyncio.wait_for(
                proc.communicate(), timeout=settings.measurement_timeout_seconds
            )
        except asyncio.TimeoutError as exc:
            proc.kill()
            raise MeasurementError(
                "Proses pengukuran melebihi batas waktu.", status_code=504
            ) from exc

        if proc.returncode != 0:
            raise MeasurementError(
                "Model pengukuran gagal diproses. Coba ambil foto ulang."
            )

        values = parse_model_output(stdout_b.decode("utf-8", errors="replace"))
        warnings = _sanity_warnings(values)
        return MeasurementResult(
            waist_cm=values.get("waist_cm"),
            hip_cm=values.get("hip_cm"),
            arm_length_cm=values.get("arm_length_cm"),
            shoulder_width_cm=values.get("shoulder_width_cm"),
            chest_cm=values.get("chest_cm"),
            confidence=_confidence(values, warnings),  # type: ignore[arg-type]
            warnings=warnings,
        )
    finally:
        # Privacy: always remove the uploaded photo.
        try:
            os.remove(path)
        except OSError:
            pass

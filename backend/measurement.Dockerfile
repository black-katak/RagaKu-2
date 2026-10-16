# RagaKu measurement service.
#
# Wraps Human-Body-Measurements-using-Computer-Vision, which requires
# TensorFlow 1.13.1 (PRD section 8). TF 1.13.1 wheels target Python 3.6.
#
# Build context must be the model repository root
# (Human-Body-Measurements-using-Computer-Vision-master), e.g.:
#
#   docker build -f ../RagaKu-2-main/backend/measurement.Dockerfile \
#     -t ragaku-measure .
#
# Then run per request (the API's MEASUREMENT_COMMAND does this):
#   docker run --rm -v /tmp:/tmp ragaku-measure python3 inference.py -i {image} -ht {height}
#
# The pre-trained HMR models (models.tar.gz) and DeepLab checkpoint must be
# present under models/ / deeplab_model/ (see README). Mount or COPY them in.
FROM python:3.6-slim

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender1 libgl1-mesa-glx wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# requirements.txt in the model repo pins tensorflow==1.13.1 and friends.
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade "pip<21" \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

# Default command is overridden per request by the API.
CMD ["python3", "inference.py", "--help"]

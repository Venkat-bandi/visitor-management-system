# Stage 1: Builder stage 
FROM python:3.9-slim as builder 
 
WORKDIR /app 
 
COPY ml-service/reqs.txt . 
 
# Install all dependencies 
RUN pip install --user --no-cache-dir --no-warn-script-location -r reqs.txt 
 
# Stage 2: Runtime stage (smaller) 
FROM python:3.9-slim 
 
WORKDIR /app 
 
# Copy only installed packages from builder 
COPY --from=builder /root/.local /root/.local 
 
# Install minimal system dependencies 
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 libsm6 libxext6 libxrender-dev libgthread-2.0-0 && apt-get clean && rm -rf /var/lib/apt/lists/* 
 
# Copy application code 
COPY ml-service . 
 
# Add Python user packages to PATH 
ENV PATH=/root/.local/bin:$PATH 
ENV PYTHONPATH=/root/.local/lib/python3.9/site-packages:$PYTHONPATH 
 
ENV PORT=5001 
EXPOSE 5001 
 
CMD ["python", "app.py"] 

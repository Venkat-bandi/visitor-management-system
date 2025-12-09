FROM python:3.9-slim 
 
WORKDIR /app 
 
RUN apt-get update && apt-get install -y  
    libgl1  
    libglib2.0-0  
    libsm6  
    libxext6  
    libxrender-dev  
    libgthread-2.0-0  
    libgtk2.0-0  
    libgtk-3-0  
    libjpeg-dev  
    libpng-dev  
    libtiff-dev  
    && apt-get clean  
    && rm -rf /var/lib/apt/lists/* 
 
COPY ml-service/reqs.txt . 
 
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r reqs.txt 
 
COPY ml-service . 
 
ENV PORT=5001 
EXPOSE 5001 
 
CMD ["python", "app.py"] 

FROM python:3.9-slim 
 
WORKDIR /app 
 
RUN apt-get update && apt-get install -y libgl1-mesa-glx 
 
COPY ml-service/reqs.txt . 
 
RUN pip install --no-cache-dir -r reqs.txt 
 
COPY ml-service . 
 
EXPOSE 10000 
 
CMD ["python", "app.py"] 

FROM python:3.9-slim 
 
WORKDIR /app 
 
COPY reqs.txt . 
 
RUN pip install --no-cache-dir -r reqs.txt 
 
COPY . . 
 
EXPOSE 10000 
 
CMD ["python", "app.py"] 

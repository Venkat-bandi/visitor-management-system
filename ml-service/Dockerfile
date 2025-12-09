FROM python:3.9-slim

WORKDIR /app

COPY requirements_high_accuracy.txt .

RUN pip install --no-cache-dir -r requirements_high_accuracy.txt

COPY . .

EXPOSE 10000

CMD ["python", "app.py"]
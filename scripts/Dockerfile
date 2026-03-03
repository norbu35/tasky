FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY scrape-unegui.py .

RUN mkdir /data

VOLUME ["/data"]

ENTRYPOINT ["python", "/app/scrape-unegui.py"]

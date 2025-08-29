# Use an official lightweight Python image
FROM python:3.9-slim

# Set environment variables to prevent Python from buffering logs
ENV PYTHONUNBUFFERED True

# Set the working directory inside the container
WORKDIR /app

# Copy the file that lists the dependencies
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code into the container
COPY . .

# Tell the container to listen on port 8080
EXPOSE 8080

# Run the Gunicorn web server to start your Flask app
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--threads", "8", "main:app"]
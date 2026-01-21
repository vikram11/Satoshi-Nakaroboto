FROM python:3.10-slim

WORKDIR /app

# Install build dependencies if needed (e.g. for some pip packages)
# RUN apt-get update && apt-get install -y build-essential

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Setup data directory for persistence
RUN mkdir -p data

# Expose port (Internal in Coolify, but good practice)
EXPOSE 8000

# Run the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

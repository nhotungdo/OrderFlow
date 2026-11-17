-- Database initialization script for OrderFlow Microservices
-- Runs automatically when Postgres container initializes for the first time

CREATE DATABASE orderflow_orders;
CREATE DATABASE orderflow_inventory;
CREATE DATABASE orderflow_payments;

\c orderflow_orders;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c orderflow_inventory;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c orderflow_payments;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

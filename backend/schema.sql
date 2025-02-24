CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL,  -- doctor, patient, manager
    password TEXT NOT NULL
);

-- Create an index for faster lookups
CREATE INDEX idx_users_username ON users(username);

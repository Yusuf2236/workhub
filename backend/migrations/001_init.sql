-- 001_create_users.sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 002_create_vacancies.sql
CREATE TABLE IF NOT EXISTS vacancies (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    salary VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 003_create_applications.sql
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    vacancy_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 004_create_resumes.sql
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 005_create_chat_messages.sql
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

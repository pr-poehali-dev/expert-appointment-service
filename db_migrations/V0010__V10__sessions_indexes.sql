CREATE TABLE t_p60955846_expert_appointment_s.sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p60955846_expert_appointment_s.users(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON t_p60955846_expert_appointment_s.sessions(token);
CREATE INDEX idx_users_email ON t_p60955846_expert_appointment_s.users(email);
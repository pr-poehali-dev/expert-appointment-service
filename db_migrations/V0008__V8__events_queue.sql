CREATE TABLE t_p60955846_expert_appointment_s.events (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    produced_by VARCHAR(100) NOT NULL,
    consumed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

CREATE INDEX idx_events_topic_status ON t_p60955846_expert_appointment_s.events(topic, status);
CREATE TABLE config_thresholds (
    key TEXT PRIMARY KEY,
    value NUMERIC NOT NULL,
    unit TEXT,
    description TEXT
);

INSERT INTO config_thresholds (key, value, unit, description) VALUES
('moisture_warn', 18.5, '%', 'Moisture warning limit'),
('moisture_fail', 20.0, '%', 'Moisture fail limit'),
('yield_tolerance_pass', 3.0, '%', 'Yield agreement pass'),
('yield_tolerance_review', 10.0, '%', 'Yield agreement review threshold'),
('clean_period_days', 14, 'days', 'Clean period after feeding'),
('handling_loss_pct', 2.0, '%', 'Handling loss percentage for packaging quota');

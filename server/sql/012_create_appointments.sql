CREATE TABLE Appointments (
  id INT IDENTITY(1,1) PRIMARY KEY,
  title NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX) NULL,
  start_time DATETIME2 NOT NULL,
  end_time DATETIME2 NOT NULL,
  location NVARCHAR(255) NULL,
  customer_id INT NULL,
  deal_id INT NULL,
  assigned_to INT NOT NULL,
  created_by INT NOT NULL,
  remind_at DATETIME2 NULL,
  type NVARCHAR(20) NOT NULL DEFAULT 'APPOINTMENT',
  status NVARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Appointments_Customers FOREIGN KEY (customer_id) REFERENCES Customers(id),
  CONSTRAINT FK_Appointments_Deals FOREIGN KEY (deal_id) REFERENCES Deals(id),
  CONSTRAINT FK_Appointments_Assigned_User FOREIGN KEY (assigned_to) REFERENCES Users(id),
  CONSTRAINT FK_Appointments_Created_User FOREIGN KEY (created_by) REFERENCES Users(id)
);

CREATE INDEX IDX_Appointments_CustomerId ON Appointments(customer_id);
CREATE INDEX IDX_Appointments_DealId ON Appointments(deal_id);
CREATE INDEX IDX_Appointments_AssignedTo ON Appointments(assigned_to);
CREATE INDEX IDX_Appointments_CreatedBy ON Appointments(created_by);
CREATE INDEX IDX_Appointments_StartTime ON Appointments(start_time);
CREATE INDEX IDX_Appointments_Status ON Appointments(status);
CREATE INDEX IDX_Appointments_CreatedAt ON Appointments(created_at);
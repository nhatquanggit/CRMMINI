CREATE DATABASE crm_mini;
GO

USE crm_mini;
GO

CREATE TABLE Users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(120) NOT NULL,
  email NVARCHAR(255) NOT NULL UNIQUE,
  phone NVARCHAR(30) NULL,
  password NVARCHAR(255) NOT NULL,
  role NVARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'SALES')),
  token_version INT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE Customers (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(120) NOT NULL,
  email NVARCHAR(255) NOT NULL UNIQUE,
  phone NVARCHAR(30) NOT NULL,
  company NVARCHAR(180) NOT NULL,
  status NVARCHAR(20) NOT NULL CHECK (status IN ('NEW', 'CONTACTED', 'CONVERTED')),
  assigned_to INT NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Customers_Users FOREIGN KEY (assigned_to) REFERENCES Users(id)
);
GO

CREATE TABLE Deals (
  id INT IDENTITY(1,1) PRIMARY KEY,
  title NVARCHAR(180) NOT NULL,
  value DECIMAL(18,2) NOT NULL,
  stage NVARCHAR(20) NOT NULL CHECK (stage IN ('LEAD', 'CONTACTED', 'NEGOTIATION', 'WON', 'LOST')),
  customer_id INT NOT NULL,
  owner_id INT NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Deals_Customers FOREIGN KEY (customer_id) REFERENCES Customers(id),
  CONSTRAINT FK_Deals_Users FOREIGN KEY (owner_id) REFERENCES Users(id)
);
GO

CREATE TABLE Activities (
  id INT IDENTITY(1,1) PRIMARY KEY,
  type NVARCHAR(20) NOT NULL CHECK (type IN ('CALL', 'EMAIL', 'MEETING')),
  note NVARCHAR(MAX) NOT NULL,
  customer_id INT NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Activities_Customers FOREIGN KEY (customer_id) REFERENCES Customers(id)
);
GO

CREATE TABLE Avatars (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NOT NULL,
  image_url NVARCHAR(MAX) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Avatars_Users FOREIGN KEY (user_id) REFERENCES Users(id)
);
GO

CREATE INDEX IX_Customers_AssignedTo ON Customers(assigned_to);
CREATE INDEX IX_Deals_CustomerId ON Deals(customer_id);
CREATE INDEX IX_Deals_OwnerId ON Deals(owner_id);
CREATE INDEX IX_Activities_CustomerId ON Activities(customer_id);
CREATE INDEX IX_Avatars_UserId ON Avatars(user_id);
GO

-- Optional for local development: map existing SQL login to crm_mini database.
IF SUSER_ID('nhatquang') IS NOT NULL
BEGIN
  IF USER_ID('nhatquang') IS NULL
    CREATE USER [nhatquang] FOR LOGIN [nhatquang];

  ALTER ROLE db_datareader ADD MEMBER [nhatquang];
  ALTER ROLE db_datawriter ADD MEMBER [nhatquang];
END
GO

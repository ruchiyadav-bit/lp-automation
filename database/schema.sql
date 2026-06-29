-- =============================================================
-- LandingPageSaaS — Database Schema
-- Safe to re-run: drops existing tables before recreating
-- Run: mysql -u root -p < database/schema.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS landingpagesaas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE landingpagesaas;

-- Drop in reverse FK order to avoid constraint errors
DROP TABLE IF EXISTS emails;
DROP TABLE IF EXISTS pages;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS users;

-- -------------------------------------------------------------
-- users
-- -------------------------------------------------------------
CREATE TABLE users (
  id               INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(120)     NOT NULL,
  email            VARCHAR(191)     NOT NULL UNIQUE,
  password         VARCHAR(255)     NOT NULL,
  role             ENUM('user','admin') NOT NULL DEFAULT 'user',
  features_enabled JSON             DEFAULT NULL,
  created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- pages
-- -------------------------------------------------------------
CREATE TABLE pages (
  id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED  NOT NULL,
  type         ENUM('landing','cookie','age-verification','newsletter','other') NOT NULL DEFAULT 'landing',
  domain       VARCHAR(255)  DEFAULT NULL,
  html_content LONGTEXT      DEFAULT NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_pages_type (type),

  CONSTRAINT fk_pages_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- -------------------------------------------------------------
-- emails
-- -------------------------------------------------------------
CREATE TABLE emails (
  id         INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  page_id    INT UNSIGNED  NOT NULL,
  email      VARCHAR(191)  NOT NULL,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_emails_page_email (page_id, email),

  CONSTRAINT fk_emails_page
    FOREIGN KEY (page_id) REFERENCES pages (id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- -------------------------------------------------------------
-- templates
-- -------------------------------------------------------------
CREATE TABLE templates (
  id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(191)  NOT NULL,
  type         ENUM('landing','cookie','age-verification','email','other') NOT NULL DEFAULT 'other',
  html_content LONGTEXT      DEFAULT NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_templates_type (type)
);

-- -------------------------------------------------------------
-- Seed: default templates
-- -------------------------------------------------------------
INSERT INTO templates (name, type) VALUES
  ('Cookie Consent Banner',  'cookie'),
  ('Age Verification Gate',  'age-verification'),
  ('SaaS Hero Landing Page', 'landing'),
  ('Welcome Email',          'email'),
  ('Password Reset Email',   'email');

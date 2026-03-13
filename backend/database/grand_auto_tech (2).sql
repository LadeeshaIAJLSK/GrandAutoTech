-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 13, 2026 at 04:18 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `grand_auto_tech`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `action` varchar(255) NOT NULL,
  `model` varchar(255) NOT NULL,
  `model_id` bigint(20) UNSIGNED DEFAULT NULL,
  `description` text NOT NULL,
  `changes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`changes`)),
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `risk_level` enum('low','medium','high') NOT NULL DEFAULT 'low',
  `risk_reason` text DEFAULT NULL,
  `is_suspicious` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `branch_id`, `action`, `model`, `model_id`, `description`, `changes`, `ip_address`, `user_agent`, `risk_level`, `risk_reason`, `is_suspicious`, `created_at`) VALUES
(1, 5, 1, 'viewed', 'Job Card', 192, 'Accessed Job Card', NULL, '13.153.88.171', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-06 05:09:42'),
(2, 2, 1, 'deleted', 'Task', 39, 'Removed Task from system', NULL, '54.157.240.135', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-28 12:09:42'),
(3, 2, 1, 'rejected', 'Job Card', 367, 'Declined Job Card', '\"{\\\"status\\\":\\\"pending\\\",\\\"amount\\\":38376}\"', '150.85.190.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'high', 'Bulk data export', 1, '2026-02-11 11:09:42'),
(4, 1, 2, 'downloaded', 'Task', 95, 'Downloaded Task #1580', NULL, '209.76.47.238', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-27 05:09:42'),
(5, 4, 2, 'created', 'Job Card', 247, 'Added Job Card for customer', NULL, '137.194.88.113', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-14 20:09:42'),
(6, 4, 1, 'updated', 'Invoice', 326, 'Updated Invoice #8703', NULL, '113.179.161.90', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-18 10:09:42'),
(7, 1, 2, 'approved', 'Payment', 164, 'Confirmed Payment', NULL, '100.78.247.42', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-05 13:09:42'),
(8, 1, 1, 'rejected', 'Job Card', 454, 'Rejected Job Card #8653', NULL, '15.212.52.88', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-17 12:09:42'),
(9, 1, 1, 'deleted', 'Customer', 417, 'Deleted Customer #4280', NULL, '192.34.112.247', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-01 06:09:42'),
(10, 4, 1, 'viewed', 'Customer', 456, 'Viewed Customer #6628', NULL, '188.20.242.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-15 07:09:42'),
(11, 1, 1, 'viewed', 'Quotation', 429, 'Viewed Quotation #3025', NULL, '230.37.197.205', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-07 16:09:42'),
(12, 4, 2, 'deleted', 'Customer', 99, 'Deleted Customer #2114', NULL, '230.177.55.145', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-17 08:09:42'),
(13, 1, 1, 'downloaded', 'Payment', 29, 'Downloaded Payment #752', NULL, '178.222.156.60', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-05 18:09:42'),
(14, 5, 2, 'deleted', 'Invoice', 131, 'Removed Invoice from system', NULL, '158.79.208.109', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-17 14:09:42'),
(15, 2, 1, 'approved', 'Job Card', 398, 'Confirmed Job Card', NULL, '156.111.171.34', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-16 01:09:42'),
(16, 5, 1, 'deleted', 'Quotation', 93, 'Removed Quotation from system', NULL, '12.100.5.93', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-28 22:09:42'),
(17, 1, 1, 'rejected', 'Customer', 146, 'Declined Customer', NULL, '253.115.101.6', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-27 22:09:42'),
(18, 2, 1, 'updated', 'Task', 388, 'Updated Task #5563', NULL, '138.49.162.137', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-27 08:09:42'),
(19, 1, 2, 'viewed', 'Customer', 444, 'Accessed Customer', NULL, '43.12.139.251', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-06 11:09:42'),
(20, 3, 1, 'viewed', 'Job Card', 215, 'Accessed Job Card', NULL, '182.224.59.19', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-14 04:09:42'),
(21, 3, 2, 'downloaded', 'Quotation', 386, 'Downloaded Quotation #4070', NULL, '24.64.253.73', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-08 03:09:42'),
(22, 2, 2, 'deleted', 'Invoice', 375, 'Deleted Invoice #4103', '\"{\\\"status\\\":\\\"pending\\\",\\\"amount\\\":15062}\"', '117.215.155.72', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'high', 'Unusual IP address detected', 1, '2026-02-11 14:09:42'),
(23, 2, 2, 'approved', 'Job Card', 223, 'Confirmed Job Card', NULL, '72.117.84.237', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-15 18:09:42'),
(24, 4, 1, 'updated', 'Invoice', 445, 'Modified Invoice details', NULL, '33.29.38.73', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-26 21:09:42'),
(25, 1, 1, 'deleted', 'Payment', 94, 'Deleted Payment #1211', NULL, '222.36.66.141', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-17 12:09:42'),
(26, 3, 1, 'rejected', 'Job Card', 77, 'Declined Job Card', NULL, '167.187.15.122', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-06 02:09:42'),
(27, 4, 1, 'updated', 'Job Card', 429, 'Modified Job Card details', NULL, '192.146.129.140', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-12 03:09:42'),
(28, 2, 1, 'created', 'Customer', 435, 'Added Customer for customer', NULL, '123.32.4.108', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-15 16:09:42'),
(29, 3, 1, 'created', 'Job Card', 229, 'Added Job Card for customer', '\"{\\\"status\\\":\\\"pending\\\",\\\"amount\\\":44859}\"', '16.134.222.222', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'high', 'Unusual IP address detected', 1, '2026-03-02 22:09:42'),
(30, 3, 1, 'deleted', 'Customer', 249, 'Deleted Customer #9312', NULL, '76.101.182.249', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-22 13:09:42'),
(31, 3, 1, 'updated', 'Customer', 162, 'Modified Customer details', NULL, '245.76.62.251', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-28 06:09:42'),
(32, 5, 2, 'updated', 'Invoice', 283, 'Updated Invoice #8544', NULL, '51.136.39.167', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-26 04:09:42'),
(33, 4, 1, 'rejected', 'Customer', 130, 'Declined Customer', NULL, '213.109.204.208', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-06 14:09:42'),
(34, 2, 1, 'downloaded', 'Invoice', 358, 'Exported Invoice', NULL, '91.180.243.201', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-12 17:09:42'),
(35, 1, 1, 'created', 'Quotation', 185, 'Created new Quotation #2280', NULL, '96.137.121.225', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-05 09:09:42'),
(36, 1, 2, 'viewed', 'Job Card', 18, 'Viewed Job Card #1835', NULL, '229.134.85.109', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-11 00:09:42'),
(37, 2, 2, 'downloaded', 'Invoice', 395, 'Downloaded Invoice #1885', NULL, '129.143.37.161', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-12 11:09:42'),
(38, 3, 2, 'approved', 'Payment', 266, 'Confirmed Payment', NULL, '185.127.141.105', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-07 06:09:42'),
(39, 2, 2, 'rejected', 'Customer', 299, 'Declined Customer', NULL, '194.107.23.164', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-13 19:09:42'),
(40, 4, 1, 'updated', 'Invoice', 46, 'Modified Invoice details', NULL, '123.171.28.66', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-27 11:09:42'),
(41, 3, 1, 'viewed', 'Payment', 73, 'Viewed Payment #9031', NULL, '183.250.42.58', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-06 05:09:42'),
(42, 2, 2, 'created', 'Job Card', 227, 'Added Job Card for customer', NULL, '44.138.25.155', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-24 01:09:42'),
(43, 1, 2, 'downloaded', 'Task', 468, 'Exported Task', '\"{\\\"status\\\":\\\"pending\\\",\\\"amount\\\":18071}\"', '166.111.175.114', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'high', 'Multiple deletions in short timeframe', 1, '2026-02-26 10:09:42'),
(44, 2, 2, 'approved', 'Task', 40, 'Approved Task #5949', NULL, '27.171.5.255', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-04 00:09:42'),
(45, 5, 1, 'viewed', 'Invoice', 468, 'Viewed Invoice #8851', NULL, '28.77.43.238', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-09 02:09:42'),
(46, 3, 1, 'approved', 'Job Card', 82, 'Approved Job Card #7712', NULL, '198.141.220.196', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-24 21:09:42'),
(47, 5, 1, 'deleted', 'Job Card', 258, 'Deleted Job Card #7758', NULL, '243.119.103.61', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-08 03:09:42'),
(48, 4, 2, 'created', 'Invoice', 64, 'Added Invoice for customer', NULL, '193.94.187.94', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-01 00:09:42'),
(49, 1, 1, 'updated', 'Job Card', 21, 'Updated Job Card #5394', NULL, '161.117.29.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-06 05:09:42'),
(50, 2, 1, 'created', 'Task', 274, 'Added Task for customer', NULL, '31.240.42.239', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-27 04:09:42'),
(51, 1, 1, 'approved', 'Invoice', 230, 'Confirmed Invoice', NULL, '60.22.53.241', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-20 17:09:42'),
(52, 1, 1, 'created', 'Payment', 37, 'Created new Payment #4410', NULL, '175.73.134.66', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-23 18:09:42'),
(53, 2, 1, 'viewed', 'Payment', 35, 'Accessed Payment', NULL, '131.72.236.142', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-20 22:09:42'),
(54, 2, 2, 'deleted', 'Invoice', 316, 'Removed Invoice from system', NULL, '81.39.209.16', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-06 22:09:42'),
(55, 2, 1, 'deleted', 'Customer', 180, 'Removed Customer from system', NULL, '179.224.24.163', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-05 12:09:42'),
(56, 1, 2, 'viewed', 'Payment', 341, 'Viewed Payment #9183', NULL, '220.99.147.83', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-09 10:09:42'),
(57, 3, 1, 'created', 'Quotation', 18, 'Created new Quotation #7272', NULL, '65.66.102.38', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-07 03:09:42'),
(58, 4, 1, 'rejected', 'Invoice', 242, 'Rejected Invoice #5319', NULL, '129.217.209.6', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-03 21:09:42'),
(59, 1, 2, 'approved', 'Payment', 54, 'Confirmed Payment', NULL, '214.36.7.36', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-04 09:09:42'),
(60, 5, 2, 'rejected', 'Quotation', 493, 'Rejected Quotation #3111', NULL, '136.163.188.77', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-24 14:09:42'),
(61, 2, 1, 'viewed', 'Task', 289, 'Accessed Task', NULL, '132.192.213.145', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-15 00:09:42'),
(62, 2, 2, 'updated', 'Task', 424, 'Updated Task #9753', NULL, '150.54.10.106', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-08 00:09:42'),
(63, 3, 1, 'downloaded', 'Job Card', 203, 'Exported Job Card', NULL, '155.101.113.136', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-05 15:09:42'),
(64, 2, 2, 'downloaded', 'Quotation', 383, 'Exported Quotation', NULL, '106.29.82.97', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-23 14:09:42'),
(65, 5, 1, 'rejected', 'Invoice', 72, 'Declined Invoice', NULL, '168.166.199.242', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-05 13:09:42'),
(66, 2, 2, 'updated', 'Payment', 492, 'Modified Payment details', NULL, '97.180.206.60', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-24 01:09:42'),
(67, 2, 2, 'downloaded', 'Quotation', 318, 'Downloaded Quotation #7555', NULL, '81.73.3.253', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-25 04:09:42'),
(68, 2, 1, 'downloaded', 'Task', 12, 'Exported Task', NULL, '34.108.145.9', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-23 09:09:42'),
(69, 3, 1, 'approved', 'Task', 472, 'Approved Task #8186', NULL, '152.67.214.138', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-04 08:09:42'),
(70, 4, 1, 'created', 'Job Card', 232, 'Created new Job Card #5075', NULL, '101.126.127.194', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-17 11:09:42'),
(71, 5, 2, 'downloaded', 'Quotation', 254, 'Downloaded Quotation #6889', NULL, '148.200.195.228', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-21 22:09:42'),
(72, 2, 1, 'deleted', 'Invoice', 308, 'Deleted Invoice #4322', NULL, '212.232.250.197', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-05 06:09:42'),
(73, 5, 1, 'updated', 'Task', 429, 'Modified Task details', NULL, '9.208.188.199', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-15 10:09:42'),
(74, 4, 2, 'approved', 'Job Card', 305, 'Confirmed Job Card', '\"{\\\"status\\\":\\\"pending\\\",\\\"amount\\\":40908}\"', '64.212.144.144', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'medium', 'Multiple failed approvals', 1, '2026-02-10 21:09:42'),
(75, 2, 2, 'downloaded', 'Task', 451, 'Downloaded Task #566', NULL, '238.3.104.17', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-05 07:09:42'),
(76, 2, 2, 'downloaded', 'Invoice', 306, 'Downloaded Invoice #5968', NULL, '90.75.61.14', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-06 03:09:42'),
(77, 2, 1, 'rejected', 'Quotation', 253, 'Declined Quotation', NULL, '249.80.50.244', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-07 11:09:42'),
(78, 3, 1, 'deleted', 'Payment', 397, 'Removed Payment from system', NULL, '89.99.70.232', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-07 07:09:42'),
(79, 4, 2, 'rejected', 'Quotation', 253, 'Declined Quotation', NULL, '144.61.251.123', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-04 06:09:42'),
(80, 1, 2, 'approved', 'Quotation', 385, 'Confirmed Quotation', NULL, '183.173.229.252', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-15 07:09:42'),
(81, 5, 2, 'updated', 'Quotation', 248, 'Modified Quotation details', NULL, '76.164.105.245', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-02 15:09:42'),
(82, 1, 1, 'downloaded', 'Invoice', 52, 'Downloaded Invoice #8724', NULL, '51.24.2.129', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-06 12:09:42'),
(83, 1, 2, 'downloaded', 'Quotation', 145, 'Exported Quotation', NULL, '20.52.147.81', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-24 11:09:42'),
(84, 4, 1, 'deleted', 'Payment', 164, 'Removed Payment from system', NULL, '10.228.68.21', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-02 13:09:42'),
(85, 5, 1, 'approved', 'Payment', 331, 'Approved Payment #764', NULL, '73.138.168.30', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-17 02:09:42'),
(86, 4, 1, 'rejected', 'Quotation', 341, 'Declined Quotation', NULL, '142.209.49.13', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-03 05:09:42'),
(87, 4, 1, 'approved', 'Customer', 171, 'Confirmed Customer', NULL, '181.203.42.107', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-25 21:09:42'),
(88, 1, 1, 'created', 'Quotation', 129, 'Created new Quotation #3413', NULL, '234.79.31.161', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-05 21:09:42'),
(89, 2, 2, 'downloaded', 'Payment', 409, 'Downloaded Payment #8556', NULL, '131.197.35.18', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-15 01:09:42'),
(90, 1, 2, 'deleted', 'Quotation', 452, 'Deleted Quotation #6160', NULL, '8.214.155.193', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-17 05:09:42'),
(91, 3, 2, 'downloaded', 'Invoice', 62, 'Exported Invoice', NULL, '167.5.118.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-14 16:09:42'),
(92, 1, 1, 'created', 'Invoice', 280, 'Added Invoice for customer', NULL, '191.40.155.44', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-15 16:09:42'),
(93, 4, 1, 'updated', 'Task', 433, 'Modified Task details', NULL, '162.76.183.118', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-06 21:09:42'),
(94, 4, 1, 'created', 'Customer', 244, 'Created new Customer #8081', NULL, '131.98.186.87', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-07 23:09:42'),
(95, 1, 1, 'rejected', 'Task', 108, 'Rejected Task #9211', NULL, '143.31.152.189', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-25 16:09:42'),
(96, 1, 1, 'viewed', 'Task', 245, 'Accessed Task', NULL, '117.209.172.169', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-25 22:09:42'),
(97, 2, 2, 'rejected', 'Quotation', 34, 'Declined Quotation', NULL, '201.49.203.113', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-24 20:09:42'),
(98, 3, 2, 'downloaded', 'Quotation', 149, 'Downloaded Quotation #8616', NULL, '196.158.142.255', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-07 18:09:42'),
(99, 5, 2, 'rejected', 'Task', 84, 'Rejected Task #6713', NULL, '90.225.14.89', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-03-06 12:09:42'),
(100, 5, 2, 'deleted', 'Customer', 473, 'Deleted Customer #148', NULL, '55.51.142.88', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'low', NULL, 0, '2026-02-08 21:09:42');

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `city` varchar(255) DEFAULT NULL,
  `phone` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `name`, `code`, `address`, `city`, `phone`, `email`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Colombo', 'COL001', 'No. 123, Galle Road, Colombo 03', 'colombo', '+94112345678', 'colombo@grandautotech.lk', 1, '2026-03-08 03:09:40', '2026-03-11 03:33:45'),
(2, 'Kandy', 'KAN001', 'No. 456, Peradeniya Road, Kandy', 'kandy', '+94812345678', 'kandy@grandautotech.lk', 1, '2026-03-08 03:09:40', '2026-03-11 03:34:01');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) NOT NULL,
  `secondary_phone` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `id_number` varchar(255) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `customer_type` enum('individual','business') NOT NULL DEFAULT 'individual',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `branch_id`, `name`, `email`, `phone`, `secondary_phone`, `address`, `city`, `id_number`, `company_name`, `customer_type`, `is_active`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 'John Doe', 'john@example.com', '0771234567', '0761234567', '123 Main Street', 'Colombo', '123456789V', 'ui', 'individual', 1, 'Regular customer', '2026-03-08 03:09:42', '2026-03-11 03:56:23'),
(2, 2, 'Jane Smith', 'jane@example.com', '0772234567', '0762234567', '456 Oak Avenue', 'Kandy', '987654321V', NULL, 'individual', 1, 'Preferred customer', '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(3, 1, 'ABC Auto Services', 'info@abcauto.com', '0773234567', NULL, '789 Business Park', 'Colombo', '456123789', 'ABC Auto Services', 'business', 1, 'Corporate client', '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(4, 2, 'Michael Johnson', 'michael@example.com', '0774234567', '0764234567', '321 Park Road', 'Galle', '654321987V', NULL, 'individual', 1, 'New customer', '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(5, 1, 'Sarah Williams', 'sarah@example.com', '0775234567', '0765234567', '654 Elm Street', 'Matara', '321654987V', NULL, 'individual', 1, 'Regular customer', '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(6, 2, 'ladeesha', NULL, '7777', NULL, 'ggg', 'colombo', NULL, NULL, 'individual', 1, NULL, '2026-03-12 02:41:42', '2026-03-12 02:41:42'),
(7, 2, 'r', NULL, '666', NULL, 'tt', 't', NULL, NULL, 'individual', 1, NULL, '2026-03-12 02:42:52', '2026-03-12 02:42:52'),
(8, 2, 'yu', NULL, '6', NULL, 'ff', '6', NULL, NULL, 'individual', 1, NULL, '2026-03-12 02:47:00', '2026-03-12 02:47:00'),
(9, 2, 'jac', NULL, '678', NULL, 't', 'tt', NULL, NULL, 'individual', 1, NULL, '2026-03-12 02:47:29', '2026-03-12 02:47:29'),
(10, 2, 'res', NULL, '444', NULL, 'sss', 'sss', NULL, NULL, 'individual', 1, NULL, '2026-03-12 02:49:21', '2026-03-12 02:49:21'),
(11, 2, 'zz', NULL, '678', NULL, 'ee', 's', NULL, NULL, 'individual', 1, NULL, '2026-03-12 03:01:57', '2026-03-12 03:01:57'),
(12, 2, 'uouo', NULL, '666', NULL, 'ff', 'fff', NULL, NULL, 'individual', 1, NULL, '2026-03-12 03:02:26', '2026-03-12 03:02:26'),
(13, 2, 'tree', NULL, '55', NULL, 'ee', 'ee', NULL, NULL, 'individual', 1, NULL, '2026-03-12 03:02:49', '2026-03-12 03:02:49'),
(14, 2, 'flower', NULL, '55', NULL, 'd', 'f', NULL, NULL, 'individual', 1, NULL, '2026-03-12 03:05:20', '2026-03-12 03:05:20'),
(15, 2, 'sun', NULL, '6666', NULL, 'ff', 'rr', NULL, NULL, 'individual', 1, NULL, '2026-03-12 03:07:13', '2026-03-12 03:07:13'),
(16, 2, 'duck', NULL, '444', NULL, 'ff', 'ff', NULL, NULL, 'individual', 1, NULL, '2026-03-12 03:08:47', '2026-03-12 03:08:47'),
(17, 2, 'ww', NULL, '44', NULL, 'ff', '44tg', NULL, NULL, 'individual', 1, NULL, '2026-03-12 03:12:35', '2026-03-12 03:12:35'),
(18, 2, 'ty', NULL, '4444', NULL, 'ddd', 'dd', NULL, NULL, 'individual', 1, NULL, '2026-03-12 03:13:01', '2026-03-12 03:13:01'),
(19, 2, 'ttt', NULL, '444', NULL, 'ee', 'ee', NULL, NULL, 'individual', 1, NULL, '2026-03-12 03:15:18', '2026-03-12 03:15:18'),
(20, 2, 'rat', NULL, '555', NULL, 'dd', 'dd', NULL, NULL, 'individual', 1, NULL, '2026-03-12 03:15:37', '2026-03-12 03:15:37'),
(21, 1, 'ry', NULL, '555', NULL, 'rrr', 'rrr', NULL, NULL, 'individual', 1, NULL, '2026-03-12 03:39:53', '2026-03-12 03:39:53');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inspections`
--

CREATE TABLE `inspections` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `job_card_id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED DEFAULT NULL,
  `inspected_by` bigint(20) UNSIGNED NOT NULL,
  `inspection_type` enum('task','final','quality_check') NOT NULL DEFAULT 'task',
  `status` enum('approved','rejected','needs_revision') NOT NULL DEFAULT 'approved',
  `quality_rating` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `issues_found` text DEFAULT NULL,
  `inspected_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `invoice_number` varchar(255) NOT NULL,
  `job_card_id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `labor_charges` decimal(10,2) NOT NULL DEFAULT 0.00,
  `parts_charges` decimal(10,2) NOT NULL DEFAULT 0.00,
  `other_charges` decimal(10,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `advance_paid` decimal(10,2) NOT NULL DEFAULT 0.00,
  `balance_due` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','sent','paid','partially_paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
  `invoice_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `invoice_number`, `job_card_id`, `customer_id`, `created_by`, `labor_charges`, `parts_charges`, `other_charges`, `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, `advance_paid`, `balance_due`, `status`, `invoice_date`, `due_date`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'INV-2026-0001', 1, 5, 1, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 1678.00, -1678.00, 'paid', '2026-03-09', '2026-03-16', NULL, '2026-03-08 22:42:24', '2026-03-08 22:42:24'),
(2, 'INV20260300002', 7, 5, 1, 12000.00, 0.00, 0.00, 12000.00, 0.00, 0.00, 12000.00, 0.00, 0.00, 'paid', '2026-03-09', '2026-04-08', NULL, '2026-03-09 04:32:15', '2026-03-09 06:55:12'),
(3, 'INV20260300003', 6, 5, 1, 3000.00, 11000.00, 0.00, 14000.00, 1400.00, 0.00, 12600.00, 12078.00, 0.00, 'paid', '2026-03-09', '2026-04-08', NULL, '2026-03-09 05:23:59', '2026-03-09 06:52:32'),
(4, 'INV20260300004', 9, 3, 1, 8500.00, 2700.00, 3000.00, 14200.00, 1420.00, 0.00, 12780.00, 3000.00, 0.00, 'paid', '2026-03-10', '2026-04-09', NULL, '2026-03-09 23:29:24', '2026-03-09 23:55:24'),
(5, 'INV20260300005', 8, 5, 1, 2000.00, 0.00, 0.00, 2000.00, 200.00, 0.00, 1800.00, 0.00, 0.00, 'paid', '2026-03-10', '2026-04-09', NULL, '2026-03-10 01:41:53', '2026-03-10 01:49:01'),
(6, 'INV20260300006', 2, 3, 1, 6000.00, 0.00, 0.00, 6000.00, 300.00, 0.00, 5700.00, 200.00, 4900.00, 'partially_paid', '2026-03-10', '2026-04-09', NULL, '2026-03-10 01:54:10', '2026-03-10 01:55:12');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_cards`
--

CREATE TABLE `job_cards` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `job_card_number` varchar(255) NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `vehicle_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `current_mileage` int(11) DEFAULT NULL,
  `status` enum('pending','in_progress','completed','inspected') NOT NULL DEFAULT 'pending',
  `payment_status` enum('unpaid','advance_paid','partially_paid','paid') NOT NULL DEFAULT 'unpaid',
  `customer_complaint` text DEFAULT NULL,
  `initial_inspection_notes` text DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `labor_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `parts_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `other_charges` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `advance_payment` decimal(10,2) NOT NULL DEFAULT 0.00,
  `balance_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `estimated_completion_date` datetime DEFAULT NULL,
  `actual_completion_date` datetime DEFAULT NULL,
  `delivered_date` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `job_cards`
--

INSERT INTO `job_cards` (`id`, `job_card_number`, `customer_id`, `vehicle_id`, `branch_id`, `created_by`, `current_mileage`, `status`, `payment_status`, `customer_complaint`, `initial_inspection_notes`, `recommendations`, `labor_cost`, `parts_cost`, `other_charges`, `discount`, `total_amount`, `advance_payment`, `balance_amount`, `estimated_completion_date`, `actual_completion_date`, `delivered_date`, `created_at`, `updated_at`) VALUES
(1, 'JC-2026-0001', 5, 3, 1, 2, 128241, 'inspected', 'unpaid', 'Brake pedal feels soft', 'Inspection done. Starter motor issue detected.', 'Clean battery terminals and check alternator', 0.00, 0.00, 0.00, 0.00, 0.00, 1678.00, -1678.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-08 06:52:49'),
(2, 'JC-2026-0002', 3, 4, 1, 2, 107629, 'inspected', 'paid', 'Suspension noise over bumps', 'Steering alignment checked.', 'Tighten and test electrical system', 0.00, 0.00, 0.00, 0.00, 0.00, 200.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-10 01:53:26'),
(3, 'JC-2026-0003', 5, 1, 1, 2, 80346, 'pending', 'unpaid', 'Steering wheel vibrating', 'Battery terminal corrosion found.', 'Clean battery terminals and check alternator', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(4, 'JC-2026-0004', 5, 4, 1, 2, 138457, 'pending', 'unpaid', 'Steering wheel vibrating', 'Preliminary check completed. Brake fluid needs replacement.', 'Replace starter motor and battery terminals', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(5, 'JC-2026-0005', 3, 4, 1, 2, 97817, 'pending', 'unpaid', 'Strange smell from engine bay', 'Inspection done. Starter motor issue detected.', 'Check front wheel alignment', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(6, 'JC-2026-0006', 5, 6, 1, 2, 146611, 'inspected', 'paid', 'Battery drains quickly', 'Automatic transmission fluid level low.', 'Replace brake pads and check rotor condition', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-09 06:39:50'),
(7, 'JC-2026-0007', 5, 1, 1, 2, 57628, 'inspected', 'paid', 'Check engine light is on', 'Inspection done. Starter motor issue detected.', 'Replace starter motor and battery terminals', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-09 06:55:12'),
(8, 'JC-2026-0008', 5, 4, 1, 2, 126287, 'inspected', 'paid', 'Engine making noise during startup', 'Electrical connections loose.', 'Replace serpentine belt and tensioner', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-10 01:49:01'),
(9, 'JC-2026-0009', 3, 4, 1, 2, 55360, 'inspected', 'paid', 'Suspension noise over bumps', 'ECU scanned for fault codes.', 'Check front wheel alignment', 0.00, 0.00, 3000.00, 0.00, 0.00, 3000.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-09 23:27:40'),
(10, 'JC-2026-0010', 2, 2, 2, 4, 133202, 'pending', 'unpaid', 'Brake pedal feels soft', 'Automatic transmission fluid level low.', 'Replace brake pads and check rotor condition', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(11, 'JC-2026-0011', 2, 5, 2, 4, 53800, 'pending', 'unpaid', 'Engine making noise during startup', 'Inspection done. Starter motor issue detected.', 'Clear fault codes and test drive', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(12, 'JC-2026-0012', 2, 5, 2, 4, 111608, 'pending', 'unpaid', 'Transmission slipping', 'Preliminary check completed. Brake fluid needs replacement.', 'Replace shock absorbers', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(13, 'JC-2026-0013', 4, 5, 2, 4, 50107, 'pending', 'unpaid', 'Brake pedal feels soft', 'Inspection done. Starter motor issue detected.', 'Recharge AC and check refrigerant level', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(14, 'JC-2026-0014', 4, 5, 2, 4, 113392, 'pending', 'unpaid', 'Steering wheel vibrating', 'Inspection done. Starter motor issue detected.', 'Check front wheel alignment', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(15, 'JC-2026-0015', 2, 2, 2, 4, 61519, 'pending', 'unpaid', 'Battery drains quickly', 'Air con compressor not engaging properly.', 'Recharge AC and check refrigerant level', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(16, 'JC-2026-0016', 4, 5, 2, 4, 118582, 'pending', 'unpaid', 'Suspension noise over bumps', 'Battery terminal corrosion found.', 'Clean battery terminals and check alternator', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(17, 'JC-2026-0017', 4, 5, 2, 4, 113055, 'pending', 'unpaid', 'Battery drains quickly', 'Automatic transmission fluid level low.', 'Replace brake pads and check rotor condition', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(18, 'JC-2026-0018', 4, 2, 2, 4, 44362, 'pending', 'unpaid', 'Transmission slipping', 'ECU scanned for fault codes.', 'Replace starter motor and battery terminals', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(19, 'JC-2026-0019', 1, 1, 1, 1, NULL, 'pending', 'unpaid', 'e', NULL, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-10 04:49:55', '2026-03-10 04:49:55'),
(20, 'JC-2026-0020', 1, 1, 1, 1, NULL, 'pending', 'unpaid', 'l;', NULL, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-03-12 00:00:00', NULL, NULL, '2026-03-10 04:56:43', '2026-03-10 04:56:43'),
(21, 'JC-2026-0021', 1, 1, 1, 1, NULL, 'pending', 'unpaid', NULL, NULL, NULL, 0.00, 0.00, 0.00, 0.00, 6206.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-10 22:30:55', '2026-03-10 22:30:55'),
(22, 'JC-2026-0022', 1, 1, 1, 1, NULL, 'pending', 'unpaid', 'r', NULL, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-03-19 00:00:00', NULL, NULL, '2026-03-11 09:24:22', '2026-03-11 09:24:22'),
(23, 'JC-2026-0023', 1, 1, 1, 1, NULL, 'pending', 'unpaid', 'ddd', NULL, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-03-17 00:00:00', NULL, NULL, '2026-03-11 22:40:37', '2026-03-11 22:40:37'),
(24, 'JC-2026-0024', 1, 1, 1, 1, NULL, 'pending', 'unpaid', 'e', NULL, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-03-17 00:00:00', NULL, NULL, '2026-03-11 23:44:10', '2026-03-11 23:44:10'),
(25, 'JC-2026-0025', 1, 1, 1, 1, NULL, 'pending', 'unpaid', '9', NULL, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL, '2026-03-11 23:50:49', '2026-03-11 23:50:49'),
(27, 'JC-2026-0026', 3, 3, 1, 1, NULL, 'pending', 'unpaid', 'f', NULL, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-03-12 00:00:00', NULL, NULL, '2026-03-12 00:00:06', '2026-03-12 00:00:06'),
(28, 'JC-2026-0027', 20, 7, 2, 1, NULL, 'pending', 'unpaid', 'ss', NULL, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-03-17 00:00:00', NULL, NULL, '2026-03-12 03:16:58', '2026-03-12 03:16:58'),
(29, 'JC-COL001-2026-0001', 1, 1, 1, 1, NULL, 'pending', 'unpaid', 'A', NULL, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-03-27 00:00:00', NULL, NULL, '2026-03-12 08:29:07', '2026-03-12 08:29:07'),
(30, 'JC-COL001-2026-0002', 1, 4, 1, 1, NULL, 'pending', 'unpaid', 'E', NULL, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2026-03-27 00:00:00', NULL, NULL, '2026-03-12 08:36:29', '2026-03-12 08:36:29'),
(31, 'JC-COL-2026-0001', 1, 1, 1, 1, NULL, 'pending', 'paid', 'E', NULL, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 456.00, 0.00, '2026-03-12 00:00:00', NULL, NULL, '2026-03-12 08:41:30', '2026-03-12 21:43:03');

-- --------------------------------------------------------

--
-- Table structure for table `job_card_images`
--

CREATE TABLE `job_card_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `job_card_id` bigint(20) UNSIGNED NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `image_type` enum('before','during','after','front','back','right','left','interior1','interior2','dashboard','top','other1','other2') DEFAULT 'before',
  `description` text DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `job_card_images`
--

INSERT INTO `job_card_images` (`id`, `job_card_id`, `image_path`, `image_type`, `description`, `order`, `created_at`, `updated_at`) VALUES
(1, 23, '', 'before', NULL, 0, '2026-03-11 22:40:39', '2026-03-11 22:40:39'),
(2, 23, '', 'before', NULL, 0, '2026-03-11 23:13:21', '2026-03-11 23:13:21'),
(4, 28, '', 'front', NULL, 0, '2026-03-12 03:16:59', '2026-03-12 03:16:59');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_branches_table', 1),
(2, '0001_01_01_000001_create_roles_table', 1),
(3, '0001_01_01_000002_create_users_table', 1),
(4, '0001_01_01_000003_create_cache_table', 1),
(5, '0001_01_01_000003_create_password_reset_tokens_table', 1),
(6, '0001_01_01_000004_create_cache_locks_table', 1),
(7, '0001_01_01_000004_create_jobs_table', 1),
(8, '0001_01_01_000004_create_sessions_table', 1),
(9, '0001_01_01_000005_create_job_batches_table', 1),
(10, '0001_01_01_000005_create_permissions_table', 1),
(11, '0001_01_01_000006_create_failed_jobs_table', 1),
(12, '0001_01_01_000006_create_personal_access_tokens_table', 1),
(13, '0001_01_01_000007_create_role_permissions_table', 1),
(14, '2026_02_16_164736_create_customers_table', 1),
(15, '2026_02_16_164748_create_vehicles_table', 1),
(16, '2026_02_19_033830_create_job_cards_table', 1),
(17, '2026_02_19_034416_create_job_card_images_table', 1),
(18, '2026_02_19_034514_create_tasks_table', 1),
(19, '2026_02_19_034552_create_task_assignments_table', 1),
(20, '2026_02_19_034736_create_task_time_tracking_table', 1),
(21, '2026_02_19_034852_create_spare_parts_requests_table', 1),
(22, '2026_02_19_034937_create_inspections_table', 1),
(23, '2026_02_19_035040_create_invoices_table', 1),
(24, '2026_02_19_035140_create_payments_table', 1),
(25, '2026_02_20_103222_create_quotations_table', 1),
(26, '2026_02_20_154628_create_petty_cash_tables', 1),
(27, '2026_02_23_000000_update_spare_parts_status_enum', 1),
(28, '2026_02_23_023435_update_tasks_table_add_awaiting_approval_status', 1),
(29, '2026_02_23_101128_update_spare_parts_requests_change_overall_status_enum', 1),
(30, '2026_02_23_160000_add_awaiting_approval_to_task_assignments_status', 1),
(31, '2026_02_24_050647_add_cost_price_and_amount_to_tasks_table', 1),
(32, '2026_02_24_062030_create_other_charges_table', 1),
(33, '2026_02_25_000001_add_city_to_branches_table', 1),
(34, '2026_02_27_000000_add_branch_id_to_vehicles_table', 1),
(35, '2026_02_27_000001_add_branch_id_to_customers_table', 1),
(36, '2026_02_27_000001_fix_job_cards_branch_id', 1),
(37, '2026_02_27_000003_add_branch_id_to_role_permissions_table', 1),
(38, '2026_03_01_000001_remove_pricing_fields_from_tasks_table', 1),
(39, '2026_03_01_151521_update_spare_parts_requests_nullable_fields', 1),
(40, '2026_03_01_151731_update_total_cost_nullable', 1),
(41, '2026_03_01_160147_revert_spare_parts_requests_nullable_fields', 1),
(42, '2026_03_03_000000_add_petty_cash_permissions', 1),
(43, '2026_03_03_000001_fix_job_cards_status_enum', 1),
(44, '2026_03_03_102904_create_quotation_items_table', 1),
(45, '2026_03_03_105018_add_missing_columns_to_quotation_items_table', 1),
(46, '2026_03_04_000000_add_employee_details_to_users_table', 1),
(47, '2026_03_04_000000_create_activity_logs_table', 1),
(48, '2026_03_04_163339_remove_designation_from_users_table', 1),
(49, '2026_03_06_000000_add_technician_type_to_users_table', 1),
(50, '2026_03_06_000001_add_technician_type_to_role_permissions_table', 1),
(51, '2026_03_06_000002_rename_employee_role_to_technician', 1),
(52, '2026_03_07_000001_add_payment_status_to_job_cards', 2),
(53, '2026_03_10_000000_make_mileage_required_in_vehicles_table', 3),
(54, '2026_03_10_000001_rename_mileage_to_odometer_reading_in_vehicles_table', 3),
(55, '2026_03_10_000002_add_bank_name_to_payments_table', 4),
(56, '2026_03_11_000000_add_other_charges_to_quotation_items', 5),
(57, '2026_03_12_000000_update_job_card_images_enum', 6),
(58, '2026_03_12_111525_add_insurance_company_to_quotations_table', 7);

-- --------------------------------------------------------

--
-- Table structure for table `other_charges`
--

CREATE TABLE `other_charges` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `job_card_id` bigint(20) UNSIGNED NOT NULL,
  `description` varchar(255) NOT NULL,
  `cost_price` decimal(10,2) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `other_charges`
--

INSERT INTO `other_charges` (`id`, `job_card_id`, `description`, `cost_price`, `amount`, `created_at`, `updated_at`) VALUES
(1, 9, 'f', 200.00, 3000.00, '2026-03-09 23:25:04', '2026-03-09 23:25:04');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payment_number` varchar(255) NOT NULL,
  `job_card_id` bigint(20) UNSIGNED NOT NULL,
  `invoice_id` bigint(20) UNSIGNED DEFAULT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `received_by` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_type` enum('advance','partial','full','refund') NOT NULL DEFAULT 'full',
  `payment_method` enum('cash','card','bank_transfer','cheque','mobile_payment','other') NOT NULL DEFAULT 'cash',
  `bank_name` varchar(255) DEFAULT NULL,
  `reference_number` varchar(255) DEFAULT NULL,
  `payment_date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `payment_number`, `job_card_id`, `invoice_id`, `customer_id`, `received_by`, `amount`, `payment_type`, `payment_method`, `bank_name`, `reference_number`, `payment_date`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'PAY-2026-0001', 1, NULL, 5, 1, 678.00, 'advance', 'card', NULL, NULL, '2026-03-08', NULL, '2026-03-08 05:17:08', '2026-03-08 05:17:08'),
(2, 'PAY-2026-0002', 1, NULL, 5, 1, 1000.00, 'advance', 'cash', NULL, NULL, '2026-03-08', NULL, '2026-03-08 05:17:26', '2026-03-08 05:17:26'),
(3, 'PAY-2026-0003', 6, NULL, 5, 1, 1000.00, 'advance', 'card', NULL, NULL, '2026-03-09', NULL, '2026-03-09 04:38:16', '2026-03-09 04:38:16'),
(4, 'PAY-2026-0004', 6, NULL, 5, 1, 2000.00, 'advance', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 04:38:40', '2026-03-09 04:38:40'),
(5, 'PAY-2026-0005', 6, 3, 5, 1, 5000.00, 'partial', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 05:47:09', '2026-03-09 05:47:09'),
(6, 'PAY-2026-0006', 6, 3, 5, 1, 4000.00, 'partial', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 05:47:27', '2026-03-09 05:47:27'),
(7, 'PAY-2026-0007', 6, 3, 5, 1, 1000.00, 'partial', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 05:51:07', '2026-03-09 05:51:07'),
(8, 'PAY-2026-0008', 6, 3, 5, 1, 1000.00, 'partial', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 05:55:39', '2026-03-09 05:55:39'),
(9, 'PAY-2026-0009', 6, 3, 5, 1, 1000.00, 'partial', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 05:55:49', '2026-03-09 05:55:49'),
(10, 'PAY-2026-0010', 6, 3, 5, 1, 300.00, 'partial', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 06:12:59', '2026-03-09 06:12:59'),
(11, 'PAY-2026-0011', 6, 3, 5, 1, 300.00, 'partial', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 06:12:59', '2026-03-09 06:12:59'),
(12, 'PAY-2026-0012', 6, 3, 5, 1, 678.00, 'partial', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 06:23:28', '2026-03-09 06:23:28'),
(13, 'PAY-2026-0013', 6, 3, 5, 1, 78.00, 'partial', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 06:39:50', '2026-03-09 06:39:50'),
(14, 'PAY-2026-0014', 6, 3, 5, 1, 8000.00, 'partial', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 06:41:25', '2026-03-09 06:41:25'),
(15, 'PAY-2026-0015', 6, 3, 5, 1, 1000.00, 'partial', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 06:42:13', '2026-03-09 06:42:13'),
(16, 'PAY-2026-0016', 6, 3, 5, 1, 50.00, 'partial', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 06:51:58', '2026-03-09 06:51:58'),
(17, 'PAY-2026-0017', 6, 3, 5, 1, 80.00, 'partial', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 06:52:17', '2026-03-09 06:52:17'),
(18, 'PAY-2026-0018', 6, 3, 5, 1, 392.00, 'partial', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 06:52:32', '2026-03-09 06:52:32'),
(19, 'PAY-2026-0019', 7, 2, 5, 1, 12000.00, 'partial', 'cash', NULL, NULL, '2026-03-09', NULL, '2026-03-09 06:55:12', '2026-03-09 06:55:12'),
(20, 'PAY-2026-0020', 9, NULL, 3, 1, 1000.00, 'advance', 'cash', NULL, NULL, '2026-03-10', NULL, '2026-03-09 23:20:44', '2026-03-09 23:20:44'),
(21, 'PAY-2026-0021', 9, NULL, 3, 1, 2000.00, 'advance', 'card', NULL, NULL, '2026-03-10', NULL, '2026-03-09 23:21:06', '2026-03-09 23:21:06'),
(22, 'PAY-2026-0022', 9, 4, 3, 1, 8000.00, 'partial', 'cash', NULL, NULL, '2026-03-10', NULL, '2026-03-09 23:29:44', '2026-03-09 23:29:44'),
(23, 'PAY-2026-0023', 9, 4, 3, 1, 1000.00, 'partial', 'cash', NULL, NULL, '2026-03-10', NULL, '2026-03-09 23:48:21', '2026-03-09 23:48:21'),
(24, 'PAY-2026-0024', 9, 4, 3, 1, 500.00, 'partial', 'cash', NULL, NULL, '2026-03-10', NULL, '2026-03-09 23:51:20', '2026-03-09 23:51:20'),
(25, 'PAY-2026-0025', 9, 4, 3, 1, 200.00, 'partial', 'cash', NULL, NULL, '2026-03-10', NULL, '2026-03-09 23:54:54', '2026-03-09 23:54:54'),
(26, 'PAY-2026-0026', 9, 4, 3, 1, 80.00, 'full', 'cash', NULL, NULL, '2026-03-10', NULL, '2026-03-09 23:55:24', '2026-03-09 23:55:24'),
(27, 'PAY-2026-0027', 8, 5, 5, 1, 1800.00, 'full', 'card', NULL, NULL, '2026-03-10', NULL, '2026-03-10 01:49:01', '2026-03-10 01:49:01'),
(28, 'PAY-2026-0028', 2, NULL, 3, 1, 200.00, 'advance', 'card', NULL, NULL, '2026-03-10', NULL, '2026-03-10 01:52:01', '2026-03-10 01:52:01'),
(29, 'PAY-2026-0029', 2, 6, 3, 1, 600.00, 'partial', 'card', NULL, NULL, '2026-03-10', NULL, '2026-03-10 01:55:12', '2026-03-10 01:55:12'),
(30, 'PAY-2026-0030', 31, NULL, 1, 1, 456.00, 'advance', 'card', 'People\'s Bank', NULL, '2026-03-13', NULL, '2026-03-12 21:43:03', '2026-03-12 21:43:03');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `module` varchar(255) NOT NULL,
  `action` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `module`, `action`, `name`, `display_name`, `created_at`, `updated_at`) VALUES
(1, 'petty_cash', 'view', 'view_petty_cash_funds', 'View Petty Cash Funds', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(2, 'petty_cash', 'create', 'create_petty_cash_fund', 'Create Petty Cash Fund', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(3, 'petty_cash', 'edit', 'edit_petty_cash_fund', 'Edit Petty Cash Fund', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(4, 'petty_cash', 'record_expense', 'record_petty_cash_expense', 'Record Petty Cash Expense', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(5, 'petty_cash', 'approve', 'approve_petty_cash_expense', 'Approve/Reject Petty Cash Expenses', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(6, 'petty_cash', 'replenish', 'record_petty_cash_replenishment', 'Record Petty Cash Replenishment', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(7, 'dashboard', 'view', 'view_dashboard', 'View Dashboard', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(8, 'users', 'view', 'view_users', 'View Users', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(9, 'users', 'add', 'add_users', 'Add Users', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(10, 'users', 'update', 'update_users', 'Update Users', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(11, 'users', 'delete', 'delete_users', 'Delete Users', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(12, 'customers', 'view', 'view_customers', 'View Customers', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(13, 'customers', 'add', 'add_customers', 'Add Customers', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(14, 'customers', 'update', 'update_customers', 'Update Customers', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(15, 'customers', 'delete', 'delete_customers', 'Delete Customers', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(16, 'customers', 'own_data', 'own_customers', 'View Own Customer Data', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(17, 'vehicles', 'view', 'view_vehicles', 'View Vehicles', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(18, 'vehicles', 'add', 'add_vehicles', 'Add Vehicles', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(19, 'vehicles', 'update', 'update_vehicles', 'Update Vehicles', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(20, 'vehicles', 'delete', 'delete_vehicles', 'Delete Vehicles', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(21, 'job_cards', 'view', 'view_job_cards', 'View Job Cards', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(22, 'job_cards', 'add', 'add_job_cards', 'Create Job Cards', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(23, 'job_cards', 'update', 'update_job_cards', 'Update Job Cards', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(24, 'job_cards', 'delete', 'delete_job_cards', 'Delete Job Cards', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(25, 'job_cards', 'own_data', 'own_job_cards', 'View Own Job Cards', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(26, 'tasks', 'view', 'view_tasks', 'View All Tasks', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(27, 'tasks', 'add', 'add_tasks', 'Add Tasks', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(28, 'tasks', 'update', 'update_tasks', 'Update Tasks', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(29, 'tasks', 'delete', 'delete_tasks', 'Delete Tasks', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(30, 'tasks', 'own_data', 'own_tasks', 'View Own Assigned Tasks', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(31, 'spare_parts', 'view', 'view_spare_parts', 'View Spare Parts', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(32, 'spare_parts', 'add', 'add_spare_parts', 'Request Spare Parts', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(33, 'spare_parts', 'update', 'update_spare_parts', 'Update Spare Parts', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(34, 'spare_parts', 'delete', 'delete_spare_parts', 'Delete Spare Parts', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(35, 'spare_parts', 'approve', 'approve_spare_parts', 'Approve Spare Parts Requests', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(36, 'invoices', 'view', 'view_invoices', 'View Invoices', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(37, 'invoices', 'add', 'add_invoices', 'Create Invoices', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(38, 'invoices', 'update', 'update_invoices', 'Update Invoices', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(39, 'invoices', 'delete', 'delete_invoices', 'Delete Invoices', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(40, 'invoices', 'own_data', 'own_invoices', 'View Own Invoices', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(41, 'payments', 'view', 'view_payments', 'View Payments', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(42, 'payments', 'add', 'add_payments', 'Record Payments', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(43, 'payments', 'update', 'update_payments', 'Update Payments', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(44, 'financial_reports', 'view', 'view_financial_reports', 'View Financial Reports', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(45, 'inspections', 'view', 'view_inspections', 'View Inspections', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(46, 'inspections', 'approve', 'approve_inspections', 'Approve Inspections', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(47, 'settings', 'view', 'view_settings', 'View Settings', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(48, 'settings', 'update', 'update_settings', 'Update Settings', '2026-03-08 03:09:40', '2026-03-08 03:09:40');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 1, 'auth_token', '97fbc8335933c1807ee1a2420ae15b6bdd6209b662716e4597dc8cf4d7b4666e', '[\"*\"]', '2026-03-12 21:46:44', NULL, '2026-03-08 03:10:42', '2026-03-12 21:46:44'),
(3, 'App\\Models\\User', 3, 'auth_token', '1c9661c718c67503225a40f9e130e06f60291f76f0a28e9c553a3e23b8bd9410', '[\"*\"]', '2026-03-12 21:32:20', NULL, '2026-03-08 03:11:22', '2026-03-12 21:32:20'),
(8, 'App\\Models\\User', 4, 'auth_token', '46106488f2214588d8336b81db38474705aa79fea8ea6ed59d6b3a203f1e2b06', '[\"*\"]', '2026-03-10 04:30:54', NULL, '2026-03-10 04:29:13', '2026-03-10 04:30:54');

-- --------------------------------------------------------

--
-- Table structure for table `petty_cash_categories`
--

CREATE TABLE `petty_cash_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `icon` varchar(255) NOT NULL DEFAULT '?',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `petty_cash_funds`
--

CREATE TABLE `petty_cash_funds` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `fund_name` varchar(255) NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `custodian_id` bigint(20) UNSIGNED NOT NULL,
  `initial_amount` decimal(10,2) NOT NULL,
  `current_balance` decimal(10,2) NOT NULL,
  `replenishment_threshold` decimal(10,2) NOT NULL DEFAULT 1000.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `petty_cash_transactions`
--

CREATE TABLE `petty_cash_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transaction_number` varchar(255) NOT NULL,
  `fund_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('expense','replenishment') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `category` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `receipt_number` varchar(255) DEFAULT NULL,
  `receipt_image` varchar(255) DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `rejection_reason` text DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quotations`
--

CREATE TABLE `quotations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `quotation_number` varchar(255) NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `vehicle_id` bigint(20) UNSIGNED NOT NULL,
  `insurance_company` varchar(255) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `customer_complaint` text DEFAULT NULL,
  `inspection_notes` text DEFAULT NULL,
  `recommended_work` text DEFAULT NULL,
  `labor_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `parts_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `other_charges` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','sent','approved','rejected','converted','expired') NOT NULL DEFAULT 'draft',
  `valid_until` date DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `converted_at` datetime DEFAULT NULL,
  `job_card_id` bigint(20) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quotations`
--

INSERT INTO `quotations` (`id`, `quotation_number`, `customer_id`, `vehicle_id`, `insurance_company`, `created_by`, `branch_id`, `customer_complaint`, `inspection_notes`, `recommended_work`, `labor_cost`, `parts_cost`, `other_charges`, `discount`, `total_amount`, `status`, `valid_until`, `approved_at`, `converted_at`, `job_card_id`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'QT-2026-0001', 1, 1, NULL, 1, 1, NULL, NULL, NULL, 0.00, 0.00, 0.00, 0.00, 6206.00, 'converted', '2026-03-18', '2026-03-11 03:16:42', '2026-03-11 04:00:55', 21, 'w', '2026-03-10 21:03:35', '2026-03-10 22:30:55'),
(2, 'QT-2026-0002', 1, 1, 'ty', 1, 1, NULL, NULL, NULL, 0.00, 0.00, 0.00, 0.00, 2986.00, 'draft', '2026-03-19', NULL, NULL, NULL, 'd', '2026-03-12 05:49:21', '2026-03-12 05:53:51'),
(3, 'QT-2026-0003', 20, 7, 'h', 1, 2, NULL, NULL, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 'draft', '2026-03-19', NULL, NULL, NULL, NULL, '2026-03-12 08:04:44', '2026-03-12 08:04:44'),
(4, 'QT-KAN0012026-0001', 20, 7, 'zz', 1, 2, NULL, NULL, NULL, 0.00, 0.00, 0.00, 0.00, 634.00, 'draft', '2026-03-19', NULL, NULL, NULL, 'zz', '2026-03-12 08:09:46', '2026-03-12 08:12:29');

-- --------------------------------------------------------

--
-- Table structure for table `quotation_items`
--

CREATE TABLE `quotation_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `quotation_id` bigint(20) UNSIGNED NOT NULL,
  `item_type` enum('task','spare_part','other_charges') NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `task_id` bigint(20) UNSIGNED DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `quantity_or_hours` decimal(8,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quotation_items`
--

INSERT INTO `quotation_items` (`id`, `quotation_id`, `item_type`, `category`, `task_id`, `description`, `quantity_or_hours`, `unit_price`, `amount`, `notes`, `order`, `created_at`, `updated_at`) VALUES
(1, 1, 'spare_part', NULL, NULL, 'ff', 5.00, 20.00, 100.00, NULL, 1, '2026-03-10 21:04:00', '2026-03-10 21:04:00'),
(2, 1, 'task', NULL, NULL, '55', 1.00, 567.00, 567.00, 'r', 2, '2026-03-10 21:04:18', '2026-03-10 21:04:18'),
(3, 1, 'spare_part', NULL, NULL, 'fd', 4.00, 4.00, 16.00, NULL, 3, '2026-03-10 21:04:30', '2026-03-10 21:04:30'),
(4, 1, 'spare_part', NULL, NULL, 'w', 1.00, 10.00, 10.00, NULL, 4, '2026-03-10 21:29:44', '2026-03-10 21:29:44'),
(5, 1, 'other_charges', NULL, NULL, 'qw', 1.00, 12.00, 12.00, NULL, 5, '2026-03-10 21:37:24', '2026-03-10 21:37:24'),
(6, 1, 'other_charges', NULL, NULL, 'd', 1.00, 45.00, 45.00, NULL, 6, '2026-03-10 21:37:44', '2026-03-10 21:37:44'),
(7, 1, 'other_charges', NULL, NULL, 'yoyo', 1.00, 456.00, 456.00, NULL, 7, '2026-03-10 21:38:08', '2026-03-10 21:38:08'),
(8, 1, 'other_charges', NULL, NULL, 'r', 5.00, 1000.00, 5000.00, NULL, 8, '2026-03-10 21:40:10', '2026-03-10 21:40:10'),
(9, 2, 'spare_part', NULL, NULL, 'sssssssssssssssss', 45.00, 45.00, 2025.00, NULL, 1, '2026-03-12 05:53:07', '2026-03-12 05:53:07'),
(10, 2, 'other_charges', NULL, NULL, 'eee', 1.00, 345.00, 345.00, NULL, 2, '2026-03-12 05:53:19', '2026-03-12 05:53:19'),
(11, 2, 'spare_part', NULL, NULL, 'rrr', 5.00, 56.00, 280.00, NULL, 3, '2026-03-12 05:53:30', '2026-03-12 05:53:30'),
(12, 2, 'task', 'diagnostic', NULL, '333', 6.00, 56.00, 336.00, NULL, 4, '2026-03-12 05:53:51', '2026-03-12 05:53:51'),
(13, 4, 'spare_part', NULL, NULL, 'aaa', 3.00, 45.00, 135.00, NULL, 1, '2026-03-12 08:11:52', '2026-03-12 08:11:52'),
(14, 4, 'task', 'maintenance', NULL, 'ww', 3.00, 34.00, 102.00, NULL, 2, '2026-03-12 08:12:04', '2026-03-12 08:12:04'),
(15, 4, 'other_charges', NULL, NULL, 'dddd', 4.00, 67.00, 268.00, NULL, 3, '2026-03-12 08:12:13', '2026-03-12 08:12:13'),
(16, 4, 'spare_part', NULL, NULL, '3e', 43.00, 3.00, 129.00, NULL, 4, '2026-03-12 08:12:29', '2026-03-12 08:12:29');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `display_name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'super_admin', 'Super Admin', 'Full system access, all modules, can manage everything', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(2, 'branch_admin', 'Branch Admin', 'Branch-specific full access, can manage employees within branch', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(3, 'accountant', 'Accountant', 'Financial modules only, invoicing, payments, reports', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(4, 'technician', 'Technician', 'Task-specific access with employee/supervisor subtypes via technician_type field', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(5, 'support_staff', 'Support Staff', 'Customer service, booking management, create job cards', '2026-03-08 03:09:40', '2026-03-08 03:09:40'),
(6, 'customer', 'Customer', 'View-only access to their own data, approve parts requests', '2026-03-08 03:09:40', '2026-03-08 03:09:40');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `permission_id` bigint(20) UNSIGNED NOT NULL,
  `technician_type` enum('employee','supervisor') DEFAULT NULL,
  `granted` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `technician_type`, `granted`, `created_at`, `updated_at`, `branch_id`) VALUES
(49, 2, 13, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(50, 2, 37, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(51, 2, 22, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(52, 2, 42, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(53, 2, 32, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(54, 2, 27, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(55, 2, 9, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(56, 2, 18, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(57, 2, 46, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(58, 2, 5, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(59, 2, 35, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(60, 2, 2, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(61, 2, 15, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(62, 2, 39, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(63, 2, 24, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(64, 2, 34, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(65, 2, 29, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(66, 2, 11, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(67, 2, 20, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(68, 2, 3, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(69, 2, 16, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(70, 2, 40, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(71, 2, 25, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(72, 2, 30, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(73, 2, 4, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(74, 2, 6, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(75, 2, 14, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(76, 2, 38, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(77, 2, 23, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(78, 2, 43, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(79, 2, 33, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(80, 2, 28, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(81, 2, 10, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(82, 2, 19, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(83, 2, 12, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(84, 2, 7, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(85, 2, 44, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(86, 2, 45, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(87, 2, 36, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(88, 2, 21, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(89, 2, 41, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(90, 2, 1, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(91, 2, 47, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(92, 2, 31, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(93, 2, 26, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(94, 2, 8, NULL, 1, NULL, '2026-03-08 03:09:40', NULL),
(95, 2, 17, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(96, 3, 7, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(97, 3, 44, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(98, 3, 37, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(99, 3, 39, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(100, 3, 40, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(101, 3, 38, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(102, 3, 36, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(103, 3, 42, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(104, 3, 43, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(105, 3, 41, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(111, 5, 13, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(112, 5, 22, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(113, 5, 18, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(114, 5, 14, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(115, 5, 19, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(116, 5, 12, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(117, 5, 7, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(118, 5, 21, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(119, 5, 17, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(120, 6, 35, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(121, 6, 40, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(122, 6, 25, NULL, 1, NULL, '2026-03-08 03:09:41', NULL),
(485, 4, 7, NULL, 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(486, 4, 26, NULL, 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(487, 4, 27, NULL, 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(488, 4, 28, NULL, 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(489, 4, 29, NULL, 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(490, 4, 30, NULL, 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(491, 4, 32, NULL, 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(492, 4, 1, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(493, 4, 2, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(494, 4, 3, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(495, 4, 4, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(496, 4, 5, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(497, 4, 6, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(498, 4, 8, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(499, 4, 9, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(500, 4, 10, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(501, 4, 11, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(502, 4, 12, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(503, 4, 13, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(504, 4, 14, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(505, 4, 15, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(506, 4, 16, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(507, 4, 17, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(508, 4, 18, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(509, 4, 19, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(510, 4, 20, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(511, 4, 21, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(512, 4, 22, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(513, 4, 23, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(514, 4, 24, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(515, 4, 25, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(516, 4, 31, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(517, 4, 33, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(518, 4, 34, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(519, 4, 35, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(520, 4, 36, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(521, 4, 37, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(522, 4, 38, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(523, 4, 39, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(524, 4, 40, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(525, 4, 41, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(526, 4, 42, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(527, 4, 43, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(528, 4, 44, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(529, 4, 45, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(530, 4, 46, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(531, 4, 47, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(532, 4, 48, 'supervisor', 1, '2026-03-08 05:12:43', '2026-03-08 05:12:43', NULL),
(533, 1, 1, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(534, 1, 2, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(535, 1, 3, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(536, 1, 4, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(537, 1, 5, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(538, 1, 6, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(539, 1, 7, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(540, 1, 8, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(541, 1, 9, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(542, 1, 10, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(543, 1, 11, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(544, 1, 12, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(545, 1, 13, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(546, 1, 14, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(547, 1, 15, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(548, 1, 16, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(549, 1, 17, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(550, 1, 18, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(551, 1, 19, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(552, 1, 20, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(553, 1, 21, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(554, 1, 22, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(555, 1, 23, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(556, 1, 25, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(557, 1, 26, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(558, 1, 27, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(559, 1, 28, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(560, 1, 29, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(561, 1, 30, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(562, 1, 31, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(563, 1, 32, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(564, 1, 33, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(565, 1, 35, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(566, 1, 36, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(567, 1, 37, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(568, 1, 38, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(569, 1, 39, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(570, 1, 40, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(571, 1, 41, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(572, 1, 42, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(573, 1, 43, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(574, 1, 44, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(575, 1, 45, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(576, 1, 46, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(577, 1, 47, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(578, 1, 48, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL),
(579, 1, 24, NULL, 1, '2026-03-09 00:28:50', '2026-03-09 00:28:50', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `spare_parts_requests`
--

CREATE TABLE `spare_parts_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `job_card_id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED DEFAULT NULL,
  `requested_by` bigint(20) UNSIGNED NOT NULL,
  `part_name` varchar(255) NOT NULL,
  `part_number` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `selling_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `employee_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `employee_approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `employee_approved_at` datetime DEFAULT NULL,
  `employee_notes` text DEFAULT NULL,
  `admin_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `admin_approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `admin_approved_at` datetime DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `customer_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `customer_approved_at` datetime DEFAULT NULL,
  `customer_notes` text DEFAULT NULL,
  `overall_status` enum('pending','approved','rejected','ordered','process','delivered') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `spare_parts_requests`
--

INSERT INTO `spare_parts_requests` (`id`, `job_card_id`, `task_id`, `requested_by`, `part_name`, `part_number`, `description`, `quantity`, `unit_cost`, `selling_price`, `total_cost`, `employee_status`, `employee_approved_by`, `employee_approved_at`, `employee_notes`, `admin_status`, `admin_approved_by`, `admin_approved_at`, `admin_notes`, `customer_status`, `customer_approved_at`, `customer_notes`, `overall_status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 3, 'g', '3', NULL, 67, 10000.00, 12000.00, 804000.00, 'pending', NULL, NULL, NULL, 'approved', 5, '2026-03-08 09:59:48', NULL, 'approved', '2026-03-08 10:45:17', NULL, 'delivered', '2026-03-08 03:48:14', '2026-03-08 05:19:36'),
(2, 6, 4, 3, 'tt', 'd', NULL, 4, 10000.00, 11000.00, 44000.00, 'pending', NULL, NULL, NULL, 'approved', 1, '2026-03-09 10:09:26', NULL, 'approved', '2026-03-09 10:09:32', NULL, 'delivered', '2026-03-09 04:39:13', '2026-03-09 04:41:32'),
(3, 9, 6, 3, 'ty', NULL, NULL, 4, 600.00, 700.00, 2800.00, 'pending', NULL, NULL, NULL, 'approved', 1, '2026-03-10 04:50:08', NULL, 'approved', '2026-03-10 04:50:18', NULL, 'delivered', '2026-03-09 23:19:06', '2026-03-09 23:24:15'),
(4, 9, 6, 3, 'dd', NULL, NULL, 45, 1000.00, 2000.00, 90000.00, 'pending', NULL, NULL, NULL, 'approved', 1, '2026-03-10 04:50:01', NULL, 'approved', '2026-03-10 04:50:13', NULL, 'delivered', '2026-03-09 23:19:20', '2026-03-09 23:24:29');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `job_card_id` bigint(20) UNSIGNED NOT NULL,
  `task_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` enum('mechanical','electrical','bodywork','painting','diagnostic','maintenance','other') NOT NULL DEFAULT 'mechanical',
  `status` enum('pending','assigned','in_progress','awaiting_approval','completed','cancelled') DEFAULT 'pending',
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `completion_notes` text DEFAULT NULL,
  `priority` int(11) NOT NULL DEFAULT 0,
  `cost_price` int(11) DEFAULT NULL,
  `amount` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `job_card_id`, `task_name`, `description`, `category`, `status`, `started_at`, `completed_at`, `completion_notes`, `priority`, `cost_price`, `amount`, `created_at`, `updated_at`) VALUES
(1, 1, 'ee', 'e', 'mechanical', 'completed', NULL, '2026-03-08 10:46:18', NULL, 0, 2000, 5000, '2026-03-08 03:21:30', '2026-03-08 05:20:42'),
(2, 7, 'w', 'w', 'mechanical', 'completed', NULL, '2026-03-09 09:06:59', NULL, 0, 10000, 12000, '2026-03-09 03:36:02', '2026-03-09 03:38:15'),
(3, 8, 's', 's', 'mechanical', 'completed', NULL, '2026-03-09 10:06:51', NULL, 0, 670, 2000, '2026-03-09 04:24:24', '2026-03-10 01:40:57'),
(4, 6, 's', 's', 'mechanical', 'completed', NULL, '2026-03-09 10:10:17', NULL, 0, 3000, 3000, '2026-03-09 04:37:45', '2026-03-09 04:41:09'),
(5, 9, 'rr', 'r', 'mechanical', 'completed', NULL, '2026-03-10 04:52:01', NULL, 0, 3000, 4000, '2026-03-09 23:17:34', '2026-03-09 23:23:37'),
(6, 9, 'r', 'f', 'mechanical', 'completed', NULL, '2026-03-10 04:51:56', NULL, 0, 20000, 4500, '2026-03-09 23:17:42', '2026-03-09 23:23:57'),
(7, 2, '8u', 'u', 'mechanical', 'completed', NULL, '2026-03-10 07:22:26', NULL, 0, 5000, 6000, '2026-03-10 01:50:59', '2026-03-10 01:53:18'),
(8, 19, '4', NULL, 'mechanical', 'pending', NULL, NULL, NULL, 0, NULL, NULL, '2026-03-10 04:49:55', '2026-03-10 04:49:55'),
(9, 20, 'd', NULL, 'electrical', 'pending', NULL, NULL, NULL, 0, NULL, NULL, '2026-03-10 04:56:43', '2026-03-10 04:56:43'),
(10, 21, '55', 'r', 'mechanical', 'pending', NULL, NULL, NULL, 0, NULL, NULL, '2026-03-10 22:30:55', '2026-03-10 22:30:55'),
(11, 22, 'r', NULL, 'electrical', 'pending', NULL, NULL, NULL, 0, NULL, NULL, '2026-03-11 09:24:22', '2026-03-11 09:24:22'),
(12, 23, 'd', NULL, 'electrical', 'pending', NULL, NULL, NULL, 0, NULL, NULL, '2026-03-11 22:40:37', '2026-03-11 22:40:37'),
(13, 23, 'e', NULL, 'mechanical', 'pending', NULL, NULL, NULL, 0, NULL, NULL, '2026-03-11 23:12:41', '2026-03-11 23:12:41'),
(14, 24, 'r', NULL, 'electrical', 'pending', NULL, NULL, NULL, 0, NULL, NULL, '2026-03-11 23:44:10', '2026-03-11 23:44:10'),
(15, 25, '9', NULL, 'electrical', 'pending', NULL, NULL, NULL, 0, NULL, NULL, '2026-03-11 23:50:49', '2026-03-11 23:50:49'),
(17, 27, 'd', NULL, 'electrical', 'pending', NULL, NULL, NULL, 0, NULL, NULL, '2026-03-12 00:00:06', '2026-03-12 00:00:06'),
(18, 28, 's', NULL, 'electrical', 'pending', NULL, NULL, NULL, 0, NULL, NULL, '2026-03-12 03:16:58', '2026-03-12 03:16:58'),
(19, 29, 'A', NULL, 'bodywork', 'pending', NULL, NULL, NULL, 0, NULL, NULL, '2026-03-12 08:29:07', '2026-03-12 08:29:07'),
(20, 30, 'E', NULL, 'electrical', 'pending', NULL, NULL, NULL, 0, NULL, NULL, '2026-03-12 08:36:29', '2026-03-12 08:36:29'),
(21, 31, 'E', NULL, 'electrical', 'assigned', NULL, NULL, NULL, 0, 67, 89, '2026-03-12 08:41:30', '2026-03-12 21:43:27'),
(22, 31, 'rr', NULL, 'electrical', 'pending', NULL, NULL, NULL, 0, NULL, NULL, '2026-03-12 21:42:26', '2026-03-12 21:42:26');

-- --------------------------------------------------------

--
-- Table structure for table `task_assignments`
--

CREATE TABLE `task_assignments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `assigned_by` bigint(20) UNSIGNED NOT NULL,
  `assigned_at` datetime NOT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `status` enum('assigned','accepted','in_progress','awaiting_approval','completed','rejected') NOT NULL DEFAULT 'assigned',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task_assignments`
--

INSERT INTO `task_assignments` (`id`, `task_id`, `user_id`, `assigned_by`, `assigned_at`, `started_at`, `completed_at`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 1, '2026-03-08 08:53:07', NULL, '2026-03-08 10:46:18', 'completed', NULL, '2026-03-08 03:23:07', '2026-03-08 05:16:18'),
(2, 2, 3, 1, '2026-03-09 09:06:09', NULL, '2026-03-09 09:06:59', 'completed', NULL, '2026-03-09 03:36:09', '2026-03-09 03:36:59'),
(3, 3, 3, 1, '2026-03-09 09:54:30', NULL, '2026-03-09 10:06:51', 'completed', NULL, '2026-03-09 04:24:30', '2026-03-09 04:36:51'),
(4, 4, 3, 1, '2026-03-09 10:07:54', NULL, '2026-03-09 10:10:17', 'completed', NULL, '2026-03-09 04:37:54', '2026-03-09 04:40:17'),
(5, 5, 3, 1, '2026-03-10 04:47:56', NULL, '2026-03-10 04:52:01', 'completed', NULL, '2026-03-09 23:17:56', '2026-03-09 23:22:01'),
(6, 6, 3, 1, '2026-03-10 04:48:05', NULL, '2026-03-10 04:51:56', 'completed', NULL, '2026-03-09 23:18:05', '2026-03-09 23:21:56'),
(7, 7, 3, 1, '2026-03-10 07:21:07', NULL, '2026-03-10 07:22:26', 'completed', NULL, '2026-03-10 01:51:07', '2026-03-10 01:52:26'),
(11, 21, 3, 1, '2026-03-13 03:11:45', NULL, NULL, 'assigned', NULL, '2026-03-12 21:41:45', '2026-03-12 21:41:45'),
(12, 21, 5, 1, '2026-03-13 03:11:45', NULL, NULL, 'assigned', NULL, '2026-03-12 21:41:45', '2026-03-12 21:41:45');

-- --------------------------------------------------------

--
-- Table structure for table `task_time_tracking`
--

CREATE TABLE `task_time_tracking` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `task_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `task_time_tracking`
--

INSERT INTO `task_time_tracking` (`id`, `task_id`, `user_id`, `start_time`, `end_time`, `duration_minutes`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 3, '2026-03-08 08:58:26', '2026-03-08 10:45:55', 107, NULL, '2026-03-08 03:28:26', '2026-03-08 05:15:55'),
(2, 2, 3, '2026-03-09 09:06:30', '2026-03-09 09:06:39', 0, NULL, '2026-03-09 03:36:30', '2026-03-09 03:36:39'),
(3, 3, 3, '2026-03-09 09:54:57', '2026-03-09 10:06:39', 11, NULL, '2026-03-09 04:24:57', '2026-03-09 04:36:39'),
(4, 4, 3, '2026-03-09 10:09:00', '2026-03-09 10:10:09', 1, NULL, '2026-03-09 04:39:00', '2026-03-09 04:40:09'),
(5, 6, 3, '2026-03-10 04:48:49', '2026-03-10 04:51:43', 2, NULL, '2026-03-09 23:18:49', '2026-03-09 23:21:43'),
(6, 5, 3, '2026-03-10 04:48:53', '2026-03-10 04:51:47', 2, NULL, '2026-03-09 23:18:53', '2026-03-09 23:21:47'),
(7, 7, 3, '2026-03-10 07:21:25', '2026-03-10 07:21:32', 0, NULL, '2026-03-10 01:51:25', '2026-03-10 01:51:32');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `join_date` date DEFAULT NULL,
  `left_date` date DEFAULT NULL,
  `emergency_contact_name` varchar(255) DEFAULT NULL,
  `emergency_contact_no` varchar(255) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `special_notes` longtext DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `employee_code` varchar(255) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` bigint(20) UNSIGNED DEFAULT NULL,
  `technician_type` enum('employee','supervisor') DEFAULT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `first_name`, `gender`, `date_of_birth`, `join_date`, `left_date`, `emergency_contact_name`, `emergency_contact_no`, `profile_image`, `special_notes`, `email`, `phone`, `employee_code`, `email_verified_at`, `password`, `role_id`, `technician_type`, `branch_id`, `is_active`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin', NULL, 'male', '1985-01-15', '2020-01-01', NULL, 'Admin Contact', '+94771234567', NULL, NULL, 'admin@grandautotech.lk', '+94771234567', 'GAT001', '2026-03-08 03:09:42', '$2y$12$6oH9vEzDjY1ZdPPPTGaiu.F2zu64kneBUt2r62yg2Kejs3gmeIkDG', 1, NULL, NULL, 1, NULL, NULL, '2026-03-08 03:09:42'),
(2, 'Colombo Branch Manager', NULL, 'male', '1987-03-20', '2020-06-01', NULL, 'Manager Contact', '+94771234568', NULL, NULL, 'colombo.manager@grandautotech.lk', '+94771234568', 'GAT002', '2026-03-08 03:09:42', '$2y$12$ybVvaGpLBePVlCtI7ipKPepIjQzB4G/Y9Hfa1bzHet1FREALVnKhy', 2, NULL, 1, 1, NULL, NULL, '2026-03-08 03:09:42'),
(3, 'Technician Sunil', NULL, 'male', '1990-05-10', '2021-01-15', NULL, 'Sunil Contact', '+94771234570', NULL, NULL, 'technician@grandautotech.lk', '+94771234570', 'GAT004', '2026-03-08 03:09:42', '$2y$12$o5bCcmwifFdg/CocL5NrbO0WEv9QI9uPu6sBdVmyxIwsDD65Qa5Sa', 4, 'employee', 1, 1, NULL, NULL, '2026-03-08 03:09:42'),
(4, 'Technician Ravi', NULL, 'male', '1988-07-22', '2020-09-01', NULL, 'Ravi Contact', '+94771234574', NULL, NULL, 'technician.kandy@grandautotech.lk', '+94771234574', 'GAT008', '2026-03-08 03:09:42', '$2y$12$gj/IQO9/iWAljxZxFR4OFOVJeFruANoggDZqkcdFF35zED4m0oW4K', 4, 'supervisor', 2, 1, NULL, NULL, '2026-03-08 03:09:42'),
(5, 'Technician Nimal', NULL, 'male', '1988-07-22', '2020-09-01', NULL, 'Nimal Contact', '+94701234574', NULL, NULL, 'technician.nimal@grandautotech.lk', '+94701234574', 'GAT010', '2026-03-08 03:09:42', '$2y$12$823k2HgXCoHryhXB15uKu.6sRAe8gJYgBis4zkiIilJpGu/ylMSEy', 4, 'supervisor', 1, 1, NULL, NULL, '2026-03-08 03:09:42'),
(6, 'accountant', 'hana', 'female', '1990-03-25', '2026-03-09', NULL, 'W', '4', '', NULL, 'hana@gmail.com', '2222', 'MAI001', NULL, '$2y$12$kRrDuMDZrZOGcGfLmLIfvuQQFR/aJW2dCoAiNaHe/AlIpI.O5H/m6', 3, NULL, 1, 1, NULL, '2026-03-08 20:34:59', '2026-03-11 02:44:36');

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `license_plate` varchar(255) NOT NULL,
  `make` varchar(255) NOT NULL,
  `model` varchar(255) NOT NULL,
  `year` varchar(255) NOT NULL,
  `color` varchar(255) DEFAULT NULL,
  `vin` varchar(255) DEFAULT NULL,
  `engine_number` varchar(255) DEFAULT NULL,
  `chassis_number` varchar(255) DEFAULT NULL,
  `odometer_reading` int(11) NOT NULL,
  `fuel_type` varchar(255) DEFAULT NULL,
  `transmission` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `customer_id`, `branch_id`, `license_plate`, `make`, `model`, `year`, `color`, `vin`, `engine_number`, `chassis_number`, `odometer_reading`, `fuel_type`, `transmission`, `notes`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'WP-ABC-1234', 'Toyota', 'Corolla', '2020', 'Silver', 'JTDKN3AU1L0000001', 'ENG12345', 'CHS12345', 45000, 'Petrol', 'Manual', 'Regular maintenance', 1, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(2, 2, 2, 'WP-XYZ-5678', 'Honda', 'Civic', '2021', 'Blue', 'JHMES04301L000001', 'ENG54321', 'CHS54321', 32000, 'Petrol', 'Automatic', 'Premium care', 1, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(3, 3, 1, 'WP-DEF-9012', 'Hyundai', 'Elantra', '2019', 'Red', 'KMHEC6A45CU000001', 'ENG99999', 'CHS99999', 58000, 'Diesel', 'Manual', 'Commercial vehicle', 1, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(4, 1, 1, 'WP-GHI-3456', 'Nissan', 'Altima', '2022', 'White', 'NV1GE00K7R0000001', 'ENG11111', 'CHS11111', 18000, 'Petrol', 'Automatic', 'New vehicle', 1, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(5, 4, 2, 'WP-JKL-7890', 'Mazda', 'CX-5', '2021', 'Black', 'JM1BLMAE5LY000001', 'ENG22222', 'CHS22222', 35000, 'Petrol', 'Automatic', 'SUV model', 1, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(6, 5, 1, 'WP-MNO-2345', 'Suzuki', 'Swift', '2020', 'Green', 'JSAECF10L0L000001', 'ENG33333', 'CHS33333', 52000, 'Petrol', 'Manual', 'Hatchback', 1, '2026-03-08 03:09:42', '2026-03-08 03:09:42'),
(7, 20, 2, '444DF', 'dd', 'dd', '2012', NULL, NULL, NULL, NULL, 5678, NULL, NULL, NULL, 1, '2026-03-12 03:16:06', '2026-03-12 03:16:06');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_logs_user_id_created_at_index` (`user_id`,`created_at`),
  ADD KEY `activity_logs_branch_id_created_at_index` (`branch_id`,`created_at`),
  ADD KEY `activity_logs_action_created_at_index` (`action`,`created_at`),
  ADD KEY `activity_logs_is_suspicious_index` (`is_suspicious`),
  ADD KEY `activity_logs_risk_level_index` (`risk_level`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `branches_code_unique` (`code`),
  ADD KEY `branches_is_active_index` (`is_active`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customers_phone_index` (`phone`),
  ADD KEY `customers_email_index` (`email`),
  ADD KEY `customers_name_index` (`name`),
  ADD KEY `customers_is_active_index` (`is_active`),
  ADD KEY `customers_branch_id_index` (`branch_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `inspections`
--
ALTER TABLE `inspections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inspections_inspected_by_foreign` (`inspected_by`),
  ADD KEY `inspections_job_card_id_index` (`job_card_id`),
  ADD KEY `inspections_task_id_index` (`task_id`),
  ADD KEY `inspections_status_index` (`status`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoices_invoice_number_unique` (`invoice_number`),
  ADD KEY `invoices_created_by_foreign` (`created_by`),
  ADD KEY `invoices_invoice_number_index` (`invoice_number`),
  ADD KEY `invoices_job_card_id_index` (`job_card_id`),
  ADD KEY `invoices_customer_id_index` (`customer_id`),
  ADD KEY `invoices_status_index` (`status`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `job_cards`
--
ALTER TABLE `job_cards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `job_cards_job_card_number_unique` (`job_card_number`),
  ADD KEY `job_cards_created_by_foreign` (`created_by`),
  ADD KEY `job_cards_job_card_number_index` (`job_card_number`),
  ADD KEY `job_cards_customer_id_index` (`customer_id`),
  ADD KEY `job_cards_vehicle_id_index` (`vehicle_id`),
  ADD KEY `job_cards_branch_id_index` (`branch_id`),
  ADD KEY `job_cards_status_index` (`status`),
  ADD KEY `job_cards_created_at_index` (`created_at`);

--
-- Indexes for table `job_card_images`
--
ALTER TABLE `job_card_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `job_card_images_job_card_id_index` (`job_card_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `other_charges`
--
ALTER TABLE `other_charges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `other_charges_job_card_id_index` (`job_card_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payments_payment_number_unique` (`payment_number`),
  ADD KEY `payments_received_by_foreign` (`received_by`),
  ADD KEY `payments_job_card_id_index` (`job_card_id`),
  ADD KEY `payments_invoice_id_index` (`invoice_id`),
  ADD KEY `payments_customer_id_index` (`customer_id`),
  ADD KEY `payments_payment_date_index` (`payment_date`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_name_unique` (`name`),
  ADD KEY `permissions_module_action_index` (`module`,`action`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `petty_cash_categories`
--
ALTER TABLE `petty_cash_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `petty_cash_funds`
--
ALTER TABLE `petty_cash_funds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `petty_cash_funds_branch_id_foreign` (`branch_id`),
  ADD KEY `petty_cash_funds_custodian_id_foreign` (`custodian_id`);

--
-- Indexes for table `petty_cash_transactions`
--
ALTER TABLE `petty_cash_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `petty_cash_transactions_transaction_number_unique` (`transaction_number`),
  ADD KEY `petty_cash_transactions_user_id_foreign` (`user_id`),
  ADD KEY `petty_cash_transactions_approved_by_foreign` (`approved_by`),
  ADD KEY `petty_cash_transactions_transaction_number_index` (`transaction_number`),
  ADD KEY `petty_cash_transactions_fund_id_index` (`fund_id`),
  ADD KEY `petty_cash_transactions_status_index` (`status`);

--
-- Indexes for table `quotations`
--
ALTER TABLE `quotations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `quotations_quotation_number_unique` (`quotation_number`),
  ADD KEY `quotations_vehicle_id_foreign` (`vehicle_id`),
  ADD KEY `quotations_created_by_foreign` (`created_by`),
  ADD KEY `quotations_branch_id_foreign` (`branch_id`),
  ADD KEY `quotations_job_card_id_foreign` (`job_card_id`),
  ADD KEY `quotations_quotation_number_index` (`quotation_number`),
  ADD KEY `quotations_customer_id_index` (`customer_id`),
  ADD KEY `quotations_status_index` (`status`);

--
-- Indexes for table `quotation_items`
--
ALTER TABLE `quotation_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quotation_items_quotation_id_foreign` (`quotation_id`),
  ADD KEY `quotation_items_task_id_foreign` (`task_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_unique` (`name`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_permissions_role_id_permission_id_unique` (`role_id`,`permission_id`),
  ADD KEY `role_permissions_permission_id_foreign` (`permission_id`),
  ADD KEY `role_permissions_branch_id_foreign` (`branch_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `spare_parts_requests`
--
ALTER TABLE `spare_parts_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `spare_parts_requests_requested_by_foreign` (`requested_by`),
  ADD KEY `spare_parts_requests_employee_approved_by_foreign` (`employee_approved_by`),
  ADD KEY `spare_parts_requests_admin_approved_by_foreign` (`admin_approved_by`),
  ADD KEY `spare_parts_requests_job_card_id_index` (`job_card_id`),
  ADD KEY `spare_parts_requests_task_id_index` (`task_id`),
  ADD KEY `spare_parts_requests_overall_status_index` (`overall_status`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tasks_job_card_id_index` (`job_card_id`),
  ADD KEY `tasks_status_index` (`status`);

--
-- Indexes for table `task_assignments`
--
ALTER TABLE `task_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_assignments_assigned_by_foreign` (`assigned_by`),
  ADD KEY `task_assignments_task_id_index` (`task_id`),
  ADD KEY `task_assignments_user_id_index` (`user_id`);

--
-- Indexes for table `task_time_tracking`
--
ALTER TABLE `task_time_tracking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_time_tracking_task_id_index` (`task_id`),
  ADD KEY `task_time_tracking_user_id_index` (`user_id`),
  ADD KEY `task_time_tracking_start_time_index` (`start_time`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_employee_code_unique` (`employee_code`),
  ADD KEY `users_email_index` (`email`),
  ADD KEY `users_phone_index` (`phone`),
  ADD KEY `users_employee_code_index` (`employee_code`),
  ADD KEY `users_role_id_index` (`role_id`),
  ADD KEY `users_branch_id_index` (`branch_id`),
  ADD KEY `users_is_active_index` (`is_active`),
  ADD KEY `users_first_name_index` (`first_name`),
  ADD KEY `users_gender_index` (`gender`),
  ADD KEY `users_join_date_index` (`join_date`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vehicles_license_plate_unique` (`license_plate`),
  ADD KEY `vehicles_license_plate_index` (`license_plate`),
  ADD KEY `vehicles_customer_id_index` (`customer_id`),
  ADD KEY `vehicles_branch_id_index` (`branch_id`),
  ADD KEY `vehicles_make_index` (`make`),
  ADD KEY `vehicles_is_active_index` (`is_active`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inspections`
--
ALTER TABLE `inspections`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `job_cards`
--
ALTER TABLE `job_cards`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `job_card_images`
--
ALTER TABLE `job_card_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT for table `other_charges`
--
ALTER TABLE `other_charges`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `petty_cash_categories`
--
ALTER TABLE `petty_cash_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `petty_cash_funds`
--
ALTER TABLE `petty_cash_funds`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `petty_cash_transactions`
--
ALTER TABLE `petty_cash_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quotations`
--
ALTER TABLE `quotations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `quotation_items`
--
ALTER TABLE `quotation_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=580;

--
-- AUTO_INCREMENT for table `spare_parts_requests`
--
ALTER TABLE `spare_parts_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `task_assignments`
--
ALTER TABLE `task_assignments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `task_time_tracking`
--
ALTER TABLE `task_time_tracking`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activity_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inspections`
--
ALTER TABLE `inspections`
  ADD CONSTRAINT `inspections_inspected_by_foreign` FOREIGN KEY (`inspected_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inspections_job_card_id_foreign` FOREIGN KEY (`job_card_id`) REFERENCES `job_cards` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inspections_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_job_card_id_foreign` FOREIGN KEY (`job_card_id`) REFERENCES `job_cards` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `job_cards`
--
ALTER TABLE `job_cards`
  ADD CONSTRAINT `job_cards_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `job_cards_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `job_cards_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `job_cards_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `job_card_images`
--
ALTER TABLE `job_card_images`
  ADD CONSTRAINT `job_card_images_job_card_id_foreign` FOREIGN KEY (`job_card_id`) REFERENCES `job_cards` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `other_charges`
--
ALTER TABLE `other_charges`
  ADD CONSTRAINT `other_charges_job_card_id_foreign` FOREIGN KEY (`job_card_id`) REFERENCES `job_cards` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_job_card_id_foreign` FOREIGN KEY (`job_card_id`) REFERENCES `job_cards` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_received_by_foreign` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `petty_cash_funds`
--
ALTER TABLE `petty_cash_funds`
  ADD CONSTRAINT `petty_cash_funds_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `petty_cash_funds_custodian_id_foreign` FOREIGN KEY (`custodian_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `petty_cash_transactions`
--
ALTER TABLE `petty_cash_transactions`
  ADD CONSTRAINT `petty_cash_transactions_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `petty_cash_transactions_fund_id_foreign` FOREIGN KEY (`fund_id`) REFERENCES `petty_cash_funds` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `petty_cash_transactions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quotations`
--
ALTER TABLE `quotations`
  ADD CONSTRAINT `quotations_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `quotations_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quotations_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quotations_job_card_id_foreign` FOREIGN KEY (`job_card_id`) REFERENCES `job_cards` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `quotations_vehicle_id_foreign` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quotation_items`
--
ALTER TABLE `quotation_items`
  ADD CONSTRAINT `quotation_items_quotation_id_foreign` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quotation_items_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `spare_parts_requests`
--
ALTER TABLE `spare_parts_requests`
  ADD CONSTRAINT `spare_parts_requests_admin_approved_by_foreign` FOREIGN KEY (`admin_approved_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `spare_parts_requests_employee_approved_by_foreign` FOREIGN KEY (`employee_approved_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `spare_parts_requests_job_card_id_foreign` FOREIGN KEY (`job_card_id`) REFERENCES `job_cards` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `spare_parts_requests_requested_by_foreign` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `spare_parts_requests_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_job_card_id_foreign` FOREIGN KEY (`job_card_id`) REFERENCES `job_cards` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_assignments`
--
ALTER TABLE `task_assignments`
  ADD CONSTRAINT `task_assignments_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_assignments_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_assignments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_time_tracking`
--
ALTER TABLE `task_time_tracking`
  ADD CONSTRAINT `task_time_tracking_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_time_tracking_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `vehicles_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vehicles_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

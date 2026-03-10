<?php

namespace App\Enums;

enum TechnicianType: string
{
    case EMPLOYEE = 'employee';
    case SUPERVISOR = 'supervisor';

    public function label(): string
    {
        return match($this) {
            self::EMPLOYEE => 'Technician Employee',
            self::SUPERVISOR => 'Technician Supervisor',
        };
    }

    public function description(): string
    {
        return match($this) {
            self::EMPLOYEE => 'Handles assigned tasks, logs time, and requests parts',
            self::SUPERVISOR => 'Supervises technicians, manages task assignments, and oversees operations',
        };
    }
}

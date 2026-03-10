<?php

namespace App\Http\Requests;

use App\Enums\TechnicianType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'first_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20'],
            'employee_code' => ['required', 'string', 'unique:users,employee_code'],
            'password' => ['required', 'string', 'min:8'],
            'role_id' => ['required', 'exists:roles,id'],
            'technician_type' => [
                'nullable',
                Rule::enum(TechnicianType::class),
                'required_if:role_id,' . $this->getTechnicianRoleId(),
            ],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'is_active' => ['boolean'],
            'gender' => ['required', 'in:male,female,other'],
            'date_of_birth' => ['required', 'date'],
            'join_date' => ['required', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'technician_type.required_if' => 'Technician Type is required for technician role.',
            'technician_type.enum' => 'Technician Type must be either employee or supervisor.',
        ];
    }

    private function getTechnicianRoleId(): ?int
    {
        return \DB::table('roles')->where('name', 'technician')->value('id');
    }

    public function validated(): array
    {
        $validated = parent::validated();
        
        // Cast technician_type to enum if provided
        if (isset($validated['technician_type']) && is_string($validated['technician_type'])) {
            $validated['technician_type'] = TechnicianType::from($validated['technician_type']);
        }
        
        return $validated;
    }
}

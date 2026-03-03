# Job Card Status Flow & Transitions

## Overview
The Grand Auto Tech system has a complete job card lifecycle with 9 distinct statuses. Here's how each status transition happens according to the backend code:

---

## Status Lifecycle

### 1. **PENDING** → Initial Status
- **When**: Automatically set when a job card is created
- **Code Location**: `database/migrations/2026_02_19_033830_create_job_cards_table.php` (default status enum)
- **How**: When you create a new job card via `POST /job-cards`
- **User Action**: Create a new job card with customer details and initial inspection

```php
// In JobCardController::store()
// Job card created with status = 'pending' by default
```

---

### 2. **PENDING** → **IN_PROGRESS**
- **Trigger**: When any task in the job card is started
- **Code Location**: `app/Models/JobCard.php` (updateStatusBasedOnTasks method)
- **How**: When an employee starts working on any task
  ```php
  // Method in JobCard Model
  public function updateStatusBasedOnTasks()
  {
      // Check if any task is in progress
      $hasInProgressTask = $this->tasks()->where('status', 'in_progress')->exists();
      
      if ($hasInProgressTask && $this->status === 'pending') {
          $this->update(['status' => 'in_progress']);
      }
  }
  ```
- **User Action**: Employee clicks "Start Task" on any task in the job card
- **Route**: `POST /tasks/{id}/start` (TaskController::startTask)

---

### 3. **IN_PROGRESS** → **WAITING_PARTS** (Conditional)
- **Status**: *Defined in enum but logic not found in current code flow*
- **Potential Trigger**: When there are pending spare parts requests awaiting approval
- **Note**: This status might be a manual status or intended for future use

---

### 4. **IN_PROGRESS** → **WAITING_CUSTOMER** (Conditional)
- **Status**: *Defined in enum but logic not found in current code flow*
- **Potential Trigger**: When waiting for customer approval on parts or services
- **Note**: This status might be a manual status or intended for future use

---

### 5. **IN_PROGRESS** → **QUALITY_CHECK** (Inspection Phase)
- **Status**: *Defined in enum but not auto-triggered in current code*
- **Note**: When all tasks reach **"awaiting_approval"** status, they're ready for quality inspection phase
- **Code Context**: 
  - Employee marks task as done: `POST /tasks/{id}/mark-done` → task status becomes `awaiting_approval`
  - Admin/supervisor reviews and approves: `approveTask()` → task status becomes `completed`

---

### 6. **IN_PROGRESS/QUALITY_CHECK** → **COMPLETED**
- **When**: All tasks are completed and approved
- **Code Locations**: 
  - Primary: `TaskController::approveJobCard()` - lines 310-340
  - Fallback: `JobCard::markInspectionCompleted()` - in JobCard model
- **How**:
  ```php
  // In TaskController - approveJobCard method
  $jobCard->update([
      'status' => 'completed',
      'completed_at' => now(),
  ]);
  ```
- **Requirements**:
  1. All tasks must be in "completed" or "cancelled" status
  2. All tasks must have inspections that are "approved"
- **User Action**: 
  - Admin/supervisor completes job card inspection via `POST /job-cards/{jobCardId}/complete-inspection`
  - Or via task approval workflow

---

### 7. **COMPLETED** → **INVOICED**
- **When**: An invoice is generated for the job card
- **Code Location**: `InvoiceController::generateFromJobCard()` - lines 40-85
- **How**:
  ```php
  // In InvoiceController
  $jobCard->update([
      'status' => 'invoiced',
      'total_amount' => $totalAmount,
      'balance_amount' => $balanceDue
  ]);
  ```
- **Route**: `POST /job-cards/{jobCardId}/invoice/generate`
- **Requirements**:
  - Job card must be in "completed" status (or explicitly allow invoicing)
  - All spare parts must be marked as "installed"
  - All labor and charges calculated
- **Data Calculation**:
  - Labor charges = sum of all task labor_cost
  - Parts charges = sum of spare_parts_requests where overall_status = 'installed'
  - Other charges = additional charges added
  - Invoice generated with amount breakdown

---

### 8. **INVOICED** → **PAID**
- **When**: Full payment is received
- **Code Location**: `PaymentController::store()` - lines 72-75
- **How**:
  ```php
  // Update job card balance after payment
  $jobCard->advance_payment += $validated['amount'];
  $jobCard->balance_amount = $jobCard->total_amount - $jobCard->advance_payment;
  
  // Update status if fully paid
  if ($jobCard->balance_amount <= 0) {
      $jobCard->status = 'paid';
  }
  $jobCard->save();
  ```
- **Route**: `POST /payments`
- **Condition**: 
  - Automatic transition when `balance_amount <= 0`
  - Can happen through advance payments or invoice payments
- **Restrictions**: 
  - Cannot add advance payment if job card is in "quality_check" status
  ```php
  if ($validated['payment_type'] === 'advance' && $jobCard->status === 'quality_check') {
      return response()->json([
          'message' => 'Cannot add advance payment. Job card is currently in inspection phase.'
      ], 422);
  }
  ```

---

### 9. **ANY** → **CANCELLED**
- **When**: Job card is cancelled
- **Code Location**: State defined but implementation not found in current review
- **Constraints**:
  - Can only be deleted if status is "pending" or "cancelled"
  ```php
  // In JobCardController::destroy()
  if (!in_array($jobCard->status, ['pending', 'cancelled'])) {
      return response()->json([
          'message' => 'Cannot delete job card in current status. Only pending or cancelled job cards can be deleted.'
      ], 400);
  }
  ```

---

## Complete Status Transition Diagram

```
┌─────────────┐
│   PENDING   │  ← Job card created
└──────┬──────┘
       │ Task started
       ▼
┌─────────────────┐
│   IN_PROGRESS   │  ← Work is happening
└────────┬────────┘
         │ (Conditional paths)
         ├─────────────────────┐
         │ Spare parts needed  │
         ▼                     ▼
    ┌─────────────┐    ┌────────────────┐
    │WAITING_PARTS│    │WAITING_CUSTOMER│
    └──────┬──────┘    └────────┬───────┘
           │                    │
           └─────────┬──────────┘
                     │ All approvals done
                     │ Tasks submitted for approval
                     ▼
          ┌──────────────────┐
          │   QUALITY_CHECK  │  ← All tasks awaiting approval
          └────────┬─────────┘
                   │ All tasks approved
                   ▼
          ┌──────────────┐
          │   COMPLETED  │  ← All work done & inspected
          └────────┬─────┘
                   │ Invoice generated
                   ▼
          ┌──────────────┐
          │   INVOICED   │  ← Customer billed
          └────────┬─────┘
                   │ Full payment received (balance ≤ 0)
                   ▼
          ┌──────────────┐
          │    PAID      │  ← Transaction complete
          └──────────────┘

Any status → CANCELLED (if pending or cancelled)
```

---

## Key Implementation Details

### Task Status Progression (affects Job Card):
1. **pending** → **assigned** - When task is assigned to employee
2. **assigned** → **in_progress** - When employee starts work
3. **in_progress** → **awaiting_approval** - When employee marks as done (`POST /tasks/{id}/mark-done`)
4. **awaiting_approval** → **completed** - When supervisor approves (`approveTask()`)
5. **awaiting_approval** → **in_progress** - When supervisor rejects (sends back to work)

### Spare Parts Request Status (related to Job Card):
1. **pending** (approval) → **approved** → **ordered** → **process** → **delivered**
2. If any spare parts needed and not delivered, job card may transition to **waiting_parts**

### Payment Flow:
- **Advance Payment**: Recorded before work starts (reduces balance)
- **Invoice Payment**: Recorded after invoice generation
- **Partial + Advance**: Combined amount tracked
- **Fully Paid**: When total_amount - total_payments <= 0

---

## Database Enum Definition

```sql
ENUM Values:
'pending'           -- Just created
'in_progress'       -- Work started
'waiting_parts'     -- Waiting for spare parts approval/delivery
'waiting_customer'  -- Waiting for customer approval
'quality_check'     -- In inspection phase
'completed'         -- All work done
'invoiced'          -- Invoice generated
'paid'              -- Payment received
'cancelled'         -- Job cancelled
```

---

## Related Routes Summary

| Status | Endpoint | Method | Trigger |
|--------|----------|--------|---------|
| in_progress | `POST /tasks/{id}/start` | Start Task | Task started by employee |
| quality_check | `POST /tasks/{id}/mark-done` | Mark Done | Employee submits task |
| completed | `POST /job-cards/{jobCardId}/complete-inspection` | Complete Inspection | Admin approval |
| invoiced | `POST /job-cards/{jobCardId}/invoice/generate` | Generate Invoice | Generate invoice |
| paid | `POST /payments` | Record Payment | Payment received |

---

## Notes

1. **Status: waiting_parts & waiting_customer** are defined in the enum but their automatic transition logic isn't implemented in the current code version. They may be:
   - Used for manual status updates (though the PATCH endpoint is deprecated)
   - Implemented in future versions
   - Intended for specific business workflows

2. **Quality Check Status** exists but the direct transition isn't auto-triggered. The flow goes:
   - Tasks → awaiting_approval → completed → (then job card) → completed

3. **Cancelled Status** can only be used for deletion if job card is already pending or cancelled

4. **Key Validation**: Job card is locked from editing once it reaches "completed" or beyond
   ```php
   public function canBeEdited()
   {
       return !in_array($this->status, ['completed', 'invoiced', 'paid', 'cancelled']);
   }
   ```

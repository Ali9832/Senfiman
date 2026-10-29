ALTER TABLE public.faculty_inspections
  DROP CONSTRAINT IF EXISTS faculty_inspections_inspection_type_check;

ALTER TABLE public.faculty_inspections
  ADD CONSTRAINT faculty_inspections_inspection_type_check
  CHECK (inspection_type IN (
    'classroom','hallway','restroom',
    'room','bathroom','kitchen','gym','studyroom','laundry','prayer','yard','other'
  ));
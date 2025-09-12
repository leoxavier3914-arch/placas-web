export interface Person {
  id: string;
  full_name: string;
  doc_number: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string | null;
  color: string | null;
}

export interface VehiclePerson {
  vehicleId: string;
  personId: string;
  person: Person;
}

import { type SupabaseClient } from '@supabase/supabase-js';

export async function ensurePerson(
  supabase: SupabaseClient,
  companyId: string,
  fullName: string
): Promise<string> {
  const { data: existingPerson, error: personSelErr } = await supabase
    .from('people')
    .select('id')
    .eq('company_id', companyId)
    .eq('full_name', fullName)
    .maybeSingle();
  if (personSelErr) {
    throw new Error(personSelErr.message);
  }
  if (existingPerson) {
    return existingPerson.id;
  }
  const { data: newPerson, error: personInsErr } = await supabase
    .from('people')
    .insert({ company_id: companyId, full_name: fullName })
    .select()
    .single();
  if (personInsErr) {
    throw new Error(personInsErr.message);
  }
  return newPerson.id;
}

export async function ensureVehicle(
  supabase: SupabaseClient,
  companyId: string,
  plate: string,
  model: string | null,
  color: string | null
): Promise<string> {
  const { data: existingVehicle, error: vehicleSelErr } = await supabase
    .from('vehicles')
    .select('id')
    .eq('company_id', companyId)
    .eq('plate', plate)
    .maybeSingle();
  if (vehicleSelErr) {
    throw new Error(vehicleSelErr.message);
  }
  if (existingVehicle) {
    const vehicleId = existingVehicle.id;
    if (model || color) {
      const { error: vehicleUpdErr } = await supabase
        .from('vehicles')
        .update({ model, color })
        .eq('id', vehicleId);
      if (vehicleUpdErr) {
        throw new Error(vehicleUpdErr.message);
      }
    }
    return vehicleId;
  }
  const { data: newVehicle, error: vehicleInsErr } = await supabase
    .from('vehicles')
    .insert({ company_id: companyId, plate, model, color })
    .select()
    .single();
  if (vehicleInsErr) {
    throw new Error(vehicleInsErr.message);
  }
  return newVehicle.id;
}


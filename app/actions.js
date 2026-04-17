'use server'
import { supabase } from '@/lib/supabase';
import fs from 'fs/promises';
import path from 'path';

async function getLocalData() {
  try {
    const filePath = path.join(process.cwd(), 'data.json');
    const fileData = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileData);
  } catch (err) {
    console.error("Error reading local data.json:", err);
    return { students: [] };
  }
}

export async function getStudents() {
  try {
    // 1. Try Supabase
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }

    // 2. Fallback to Local
    const local = await getLocalData();
    return local.students || [];
  } catch (err) {
    console.error("Error in getStudents:", err);
    const local = await getLocalData();
    return local.students || [];
  }
}

export async function addStudent(student) {
  if (!student.name || !student.id) throw new Error("ID and Name are required");

  // 1. Try Supabase
  try {
    await supabase.from('students').insert([student]);
  } catch (err) {
    console.error("Supabase Error in addStudent:", err);
  }

  // 2. Local Persistence
  try {
    const local = await getLocalData();
    local.students = [...(local.students || []), student];
    await fs.writeFile(path.join(process.cwd(), 'data.json'), JSON.stringify(local, null, 2));
  } catch (err) {
    console.error("Local save error:", err);
  }

  return student;
}

export async function deleteStudent(id) {
  // 1. Try Supabase
  try {
    await supabase.from('students').delete().eq('id', id);
  } catch (err) {
    console.error("Supabase Error in deleteStudent:", err);
  }

  // 2. Local Persistence
  try {
    const local = await getLocalData();
    local.students = (local.students || []).filter(s => s.id != id);
    await fs.writeFile(path.join(process.cwd(), 'data.json'), JSON.stringify(local, null, 2));
  } catch (err) {
    console.error("Local delete error:", err);
  }

  return { success: true };
}

export async function updateStudent(id, updatedData) {
  // 1. Try Supabase
  try {
    await supabase.from('students').update(updatedData).eq('id', id);
  } catch (err) {
    console.error("Supabase Error in updateStudent:", err);
  }

  // 2. Local Persistence
  try {
    const local = await getLocalData();
    const idx = local.students.findIndex(s => s.id == id);
    if (idx !== -1) {
      local.students[idx] = { ...local.students[idx], ...updatedData };
      await fs.writeFile(path.join(process.cwd(), 'data.json'), JSON.stringify(local, null, 2));
    }
  } catch (err) {
    console.error("Local update error:", err);
  }

  return { success: true };
}

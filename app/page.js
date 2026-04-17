'use client';
import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { getStudents, addStudent, deleteStudent } from './actions';

export default function Page() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ id: '', name: '', age: '', course: '', grade: '' });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await getStudents();
      setStudents(data);
    } catch (err) {
      setError('Failed to fetch students.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id || !formData.name) {
      setError('ID and Name are required.');
      return;
    }
    try {
      setLoading(true);
      await addStudent({
        ...formData,
        id: parseInt(formData.id),
        age: parseInt(formData.age),
        grade: parseFloat(formData.grade)
      });
      setFormData({ id: '', name: '', age: '', course: '', grade: '' });
      await fetchStudents();
    } catch (err) {
      setError('Failed to add student.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      setLoading(true);
      await deleteStudent(id);
      await fetchStudents();
    } catch (err) {
      setError('Failed to delete student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>StudentStack</div>
        </div>
      </header>

      <div className={styles.contentArea}>
        <h1>Student Management System</h1>
        
        {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

        <section style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
          <h3>Add New Student</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            <input name="id" placeholder="ID" value={formData.id} onChange={handleInputChange} className={styles.modalInput} />
            <input name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} className={styles.modalInput} />
            <input name="age" placeholder="Age" value={formData.age} onChange={handleInputChange} className={styles.modalInput} />
            <input name="course" placeholder="Course" value={formData.course} onChange={handleInputChange} className={styles.modalInput} />
            <input name="grade" placeholder="Grade" value={formData.grade} onChange={handleInputChange} className={styles.modalInput} />
            <button type="submit" className="btn-snaptickets" style={{ padding: '10px' }}>Add Student</button>
          </form>
        </section>

        {loading ? (
          <p>Loading students...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a1a1a', borderRadius: '8px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>
                <th style={{ padding: '15px' }}>ID</th>
                <th style={{ padding: '15px' }}>Name</th>
                <th style={{ padding: '15px' }}>Age</th>
                <th style={{ padding: '15px' }}>Course</th>
                <th style={{ padding: '15px' }}>Grade</th>
                <th style={{ padding: '15px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '15px' }}>{student.id}</td>
                  <td style={{ padding: '15px' }}>{student.name}</td>
                  <td style={{ padding: '15px' }}>{student.age}</td>
                  <td style={{ padding: '15px' }}>{student.course}</td>
                  <td style={{ padding: '15px' }}>{student.grade}</td>
                  <td style={{ padding: '15px' }}>
                    <button 
                      onClick={() => handleDelete(student.id)} 
                      style={{ background: '#dc3545', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken } from '../utils/auth';

interface Department {
  _id: string;
  name: string;
  faculty: string;
  maxLevel: number;
}

export default function RegisterPage() {
  const router = useRouter();

  // Basic fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');

  // Student specific
  const [regNumber, setRegNumber] = useState('');

  // Lecturer specific
  const [staffId, setStaffId] = useState('');

  // UI state
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  // Department data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<string[]>([]);
  const [filteredDepts, setFilteredDepts] = useState<Department[]>([]);
  const [levels, setLevels] = useState<string[]>([]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

  // Fetch departments
  useEffect(() => {
    fetch(`${API_BASE}/api/departments`)
      .then(res => res.json())
      .then((data: Department[]) => {
        setDepartments(data);
        const uniqueFaculties = [...new Set(data.map((d) => d.faculty))]
        setFaculties(uniqueFaculties);
      })
      .catch(() => setMessage('Could not load departments. Make sure the server is running.'));
  }, []);

  // When faculty changes
  useEffect(() => {
    if (!faculty) {
      setFilteredDepts([]);
      setDepartment('');
      setLevels([]);
      setLevel('');
      return;
    }
    const filtered = departments.filter(d => d.faculty === faculty);
    setFilteredDepts(filtered);
    setDepartment('');
    setLevels([]);
    setLevel('');
  }, [faculty, departments]);

  // When department changes
  useEffect(() => {
    if (!department || role !== 'student') {
      setLevels([]);
      setLevel('');
      return;
    }
    const dept = departments.find(d => d.name === department && d.faculty === faculty);
    if (!dept) return;
    const lvls: string[] = [];
    for (let l = 100; l <= dept.maxLevel; l += 100) {
      lvls.push(`${l}L`);
    }
    setLevels(lvls);
    setLevel('');
  }, [department, role, departments, faculty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          faculty,
          department,
          level: role === 'student' ? level : undefined,
          dateOfBirth: dateOfBirth || undefined,
          phone: phone || undefined,
          regNumber: role === 'student' ? regNumber || undefined : undefined,
          staffId: role === 'lecturer' ? staffId || undefined : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Registration failed');
        setLoading(false);
        return;
      }

      // Auto-login
      const loginRes = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();

      if (loginData.token) {
        setAuthToken(loginData.token);
        router.push('/dashboard');
      } else {
        setMessage('Registered! Please log in.');
        router.push('/login');
      }

    } catch (err) {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 validation
  const step1Valid = name && email && password && confirmPassword &&
    password === confirmPassword && password.length >= 6

  // Step 2 validation
  const step2Valid = role &&
    (role === 'student' ? faculty && department && level : faculty && department)

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #f9fafb 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #15803d, #22c55e)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 28,
            boxShadow: '0 8px 24px rgba(22,163,74,0.25)',
          }}>
            🎓
          </div>
          <h1 style={{ marginBottom: 4 }}>Create Your Account</h1>
          <p style={{ color: '#4b5563', fontSize: 14 }}>
            Join UniWeb — your academic platform
          </p>
        </div>

        {/* Step indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          marginBottom: 32,
        }}>
          {['Account Info', 'Academic Info', 'Personal Info'].map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: step > i + 1 ? '#16a34a' : step === i + 1 ? '#16a34a' : '#e5e7eb',
                  color: step >= i + 1 ? 'white' : '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  margin: '0 auto 4px',
                }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <div style={{
                  fontSize: 11,
                  color: step === i + 1 ? '#16a34a' : '#9ca3af',
                  fontWeight: step === i + 1 ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                </div>
              </div>
              {i < 2 && (
                <div style={{
                  width: 60,
                  height: 2,
                  background: step > i + 1 ? '#16a34a' : '#e5e7eb',
                  margin: '0 4px 16px',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="card">
          <form onSubmit={handleSubmit}>

            {/* ===== STEP 1: Account Info ===== */}
            {step === 1 && (
              <div>
                <h2 style={{ marginBottom: 20, fontSize: 18 }}>Account Information</h2>

                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Your full legal name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <label>Password</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />

                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                {confirmPassword && password !== confirmPassword && (
                  <div className="alert alert-error" style={{ marginTop: 8 }}>
                    Passwords do not match
                  </div>
                )}

                <button
                  type="button"
                  className="btn-primary"
                  disabled={!step1Valid}
                  onClick={() => setStep(2)}
                  style={{ width: '100%', marginTop: 20 }}
                >
                  Next: Academic Info →
                </button>
              </div>
            )}


            {/* ===== STEP 2: Academic Info ===== */}
            {step === 2 && (
              <div>
                <h2 style={{ marginBottom: 20, fontSize: 18 }}>Academic Information</h2>

                <label>I am a...</label>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, marginBottom: 16 }}>
                  {['student', 'lecturer'].map(r => (
                    <div
                      key={r}
                      onClick={() => {
                        setRole(r)
                        setFaculty('')
                        setDepartment('')
                        setLevel('')
                      }}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: 8,
                        border: role === r ? '2px solid #16a34a' : '2px solid #e5e7eb',
                        background: role === r ? '#f0fdf4' : 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 4 }}>
                        {r === 'student' ? '🎓' : '👨‍🏫'}
                      </div>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: role === r ? '#15803d' : '#374151',
                        textTransform: 'capitalize',
                      }}>
                        {r}
                      </div>
                    </div>
                  ))}
                </div>

                {role && (
                  <>
                    <label>Faculty</label>
                    <select
                      value={faculty}
                      onChange={(e) => setFaculty(e.target.value)}
                      required
                    >
                      <option value="">Select faculty...</option>
                      {faculties.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </>
                )}

                {faculty && (
                  <>
                    <label>Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    >
                      <option value="">Select department...</option>
                      {filteredDepts.map(d => (
                        <option key={d._id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </>
                )}

                {role === 'student' && department && levels.length > 0 && (
                  <>
                    <label>Current Level</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      required
                    >
                      <option value="">Select level...</option>
                      {levels.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </>
                )}

                {/* Student reg number */}
                {role === 'student' && (
                  <>
                    <label>Registration Number</label>
                    <input
                      type="text"
                      placeholder="e.g. PSC/2022/001"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                    />
                  </>
                )}

                {/* Lecturer staff ID */}
                {role === 'lecturer' && (
                  <>
                    <label>Staff ID</label>
                    <input
                      type="text"
                      placeholder="e.g. STAFF/2020/042"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                    />
                  </>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setStep(1)}
                    style={{ flex: 1 }}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!step2Valid}
                    onClick={() => setStep(3)}
                    style={{ flex: 2 }}
                  >
                    Next: Personal Info →
                  </button>
                </div>
              </div>
            )}


            {/* ===== STEP 3: Personal Info ===== */}
            {step === 3 && (
              <div>
                <h2 style={{ marginBottom: 20, fontSize: 18 }}>Personal Information</h2>

                <label>Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />

                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +234 801 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                {/* Summary */}
                <div style={{
                  background: '#f9fafb',
                  borderRadius: 8,
                  padding: 16,
                  marginTop: 16,
                  marginBottom: 4,
                }}>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8, fontWeight: 600 }}>
                    REGISTRATION SUMMARY
                  </p>
                  {[
                    { label: 'Name', value: name },
                    { label: 'Email', value: email },
                    { label: 'Role', value: role },
                    { label: 'Faculty', value: faculty },
                    { label: 'Department', value: department },
                    role === 'student' ? { label: 'Level', value: level } : null,
                    role === 'student' && regNumber ? { label: 'Reg No', value: regNumber } : null,
                    role === 'lecturer' && staffId ? { label: 'Staff ID', value: staffId } : null,
                  ].filter(Boolean).map((item: any) => (
                    <div key={item.label} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      marginBottom: 4,
                    }}>
                      <span style={{ color: '#6b7280' }}>{item.label}</span>
                      <span style={{ fontWeight: 500, color: '#1f2937' }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {message && (
                  <div className="alert alert-error" style={{ marginTop: 12 }}>
                    {message}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setStep(2)}
                    style={{ flex: 1 }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    style={{ flex: 2 }}
                  >
                    {loading ? 'Creating account...' : '✓ Create Account'}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#4b5563' }}>
          Already have an account?{' '}
          <a href="/login">Login here</a>
        </p>

      </div>
    </div>
  );
}
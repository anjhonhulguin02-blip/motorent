import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';
import useEscapeToClose from '../hooks/useEscapeToClose';

// 🏍️ Local fallback photos — used only for motors that don't have an
// admin-uploaded image_url yet (the 6 original launch units).
import nmaxImg from '../assets/Bikes/nmaxv3.jpg';
import aeroxImg from '../assets/Bikes/aeroxv3.jpg';
import clickImg from '../assets/Bikes/click125.jpg';
import beatImg from '../assets/Bikes/beat.jpg';
import fazzioImg from '../assets/Bikes/fazzio.jpg';
import mioiImg from '../assets/Bikes/mio i 125.jpg';

function getFallbackImage(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('nmax')) return nmaxImg;
  if (n.includes('aerox')) return aeroxImg;
  if (n.includes('click')) return clickImg;
  if (n.includes('beat')) return beatImg;
  if (n.includes('fazzio')) return fazzioImg;
  if (n.includes('mio')) return mioiImg;
  return null;
}

const emptyForm = {
  name: '',
  description: '',
  tagline: '',
  rate_24hr: '',
  rate_12hr: '',
  rate_6hr: '',
  rate_1hr: '',
  status: 'Available',
  engine_size: '',
  transmission: '',
  fuel_capacity: '',
  weight: ''
};

const fieldLabelClass = "text-[0.8rem] text-slate-300 font-semibold block mb-1.5";
const fieldInputClass = "w-full px-3.5 py-2.5 bg-black/25 border border-white/10 rounded-lg text-white text-sm outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/15";

export default function AdminFleetManager() {
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [motors, setMotors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchMotors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('motorcycles')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMotors(data || []);
    } catch (err) {
      console.error('Fetch motorcycles error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotors();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setErrorMessage('');
    setShowForm(true);
  };

  const openEditForm = (motor) => {
    setEditingId(motor.id);
    setForm({
      name: motor.name || '',
      description: motor.description || '',
      tagline: motor.tagline || '',
      rate_24hr: motor.rate_24hr ?? '',
      rate_12hr: motor.rate_12hr ?? '',
      rate_6hr: motor.rate_6hr ?? '',
      rate_1hr: motor.rate_1hr ?? '',
      status: motor.status || 'Available',
      engine_size: motor.engine_size || '',
      transmission: motor.transmission || '',
      fuel_capacity: motor.fuel_capacity || '',
      weight: motor.weight || ''
    });
    setImageFile(null);
    setImagePreview(motor.image_url || getFallbackImage(motor.name));
    setErrorMessage('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  useEscapeToClose(showForm, closeForm);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage.from('motor_images').upload(fileName, file);
    if (error) throw error;

    const { data } = supabase.storage.from('motor_images').getPublicUrl(fileName);
    return data?.publicUrl || null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');

    try {
      if (!form.name.trim()) throw new Error('Motorcycle name is required.');
      if (!form.rate_24hr || !form.rate_12hr || !form.rate_6hr || !form.rate_1hr) {
        throw new Error('Please fill in all rates (24hr, 12hr, 6hr, 1hr).');
      }

      let imageUrl = editingId ? undefined : null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        tagline: form.tagline.trim(),
        rate_24hr: Number(form.rate_24hr),
        rate_12hr: Number(form.rate_12hr),
        rate_6hr: Number(form.rate_6hr),
        rate_1hr: Number(form.rate_1hr),
        status: form.status,
        engine_size: form.engine_size.trim() || null,
        transmission: form.transmission.trim() || null,
        fuel_capacity: form.fuel_capacity.trim() || null,
        weight: form.weight.trim() || null
      };
      if (imageUrl !== undefined) payload.image_url = imageUrl;

      if (editingId) {
        const { error } = await supabase.from('motorcycles').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const maxOrder = motors.reduce((max, m) => Math.max(max, m.display_order || 0), 0);
        const { error } = await supabase.from('motorcycles').insert([{ ...payload, display_order: maxOrder + 1 }]);
        if (error) throw error;
      }

      closeForm();
      fetchMotors();
      setToast({ type: 'success', message: editingId ? `"${payload.name}" updated successfully!` : `"${payload.name}" added to the fleet!` });
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'There was a problem saving the motorcycle.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (motor) => {
    setConfirmState({
      message: `Permanently remove "${motor.name}" from the fleet? This cannot be undone.`,
      danger: true,
      confirmLabel: 'Delete',
      onConfirm: () => executeDelete(motor)
    });
  };

  const executeDelete = async (motor) => {
    try {
      const { error } = await supabase.from('motorcycles').delete().eq('id', motor.id);
      if (error) throw error;
      fetchMotors();
      setToast({ type: 'success', message: `"${motor.name}" removed from the fleet.` });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to delete motorcycle.' });
    }
  };

  const handleToggleStatus = async (motor) => {
    const newStatus = motor.status === 'Available' ? 'Rented' : 'Available';
    try {
      const { error } = await supabase.from('motorcycles').update({ status: newStatus }).eq('id', motor.id);
      if (error) throw error;
      fetchMotors();
      setToast({ type: 'success', message: `"${motor.name}" marked as ${newStatus}.` });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to update motorcycle status.' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-brand-primary font-sans">
        <div className="text-center tracking-wide font-bold text-sm animate-pulse">LOADING FLEET DATA...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px]">
      <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
        <div>
          <span className="text-xs text-blue-400 font-bold uppercase tracking-[0.2em] block mb-1">Catalog Management</span>
          <h2 className="font-display text-white text-2xl font-bold">Fleet Roster</h2>
        </div>
        <button onClick={openAddForm} className="btn-primary px-5 py-2.5 text-sm">
          + Add Motorcycle
        </button>
      </div>

      {motors.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm italic bg-[rgba(10,17,32,0.75)] border border-white/5 rounded-[20px]">
          No motorcycles in the fleet yet. Click "+ Add Motorcycle" to add one.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 w-full">
          {motors.map((motor) => {
            const displayImg = motor.image_url || getFallbackImage(motor.name);
            return (
              <div
                key={motor.id}
                className="bg-[rgba(10,17,32,0.85)] backdrop-blur-lg border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ease-out shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)] hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_20px_45px_-15px_rgba(59,130,246,0.18)]"
              >
                <div className="w-full h-[160px] bg-white/[0.03] flex items-center justify-center overflow-hidden border-b border-white/5">
                  {displayImg ? (
                    <img src={displayImg} alt={motor.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🏍️</span>
                  )}
                </div>

                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-display text-white font-bold text-base">{motor.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase whitespace-nowrap border ${
                      motor.status === 'Available'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/15 text-red-400 border-red-500/30'
                    }`}>
                      {motor.status}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{motor.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                    <div className="bg-white/[0.03] rounded-md px-2.5 py-1.5 flex justify-between">
                      <span className="text-brand-muted">24hr</span>
                      <span className="text-brand-primary font-bold">₱{motor.rate_24hr}</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-md px-2.5 py-1.5 flex justify-between">
                      <span className="text-brand-muted">12hr</span>
                      <span className="text-brand-primary font-bold">₱{motor.rate_12hr}</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-md px-2.5 py-1.5 flex justify-between">
                      <span className="text-brand-muted">6hr</span>
                      <span className="text-brand-primary font-bold">₱{motor.rate_6hr}</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-md px-2.5 py-1.5 flex justify-between">
                      <span className="text-brand-muted">1hr</span>
                      <span className="text-brand-primary font-bold">₱{motor.rate_1hr}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto pt-3 border-t border-white/5 flex-wrap">
                    <button onClick={() => openEditForm(motor)} className="flex-1 min-w-[80px] py-2 px-2 rounded-lg text-xs font-bold cursor-pointer transition-colors bg-white/5 text-white border border-white/10 hover:bg-white/10">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleToggleStatus(motor)} className="flex-1 min-w-[80px] py-2 px-2 rounded-lg text-xs font-bold cursor-pointer transition-colors bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20">
                      {motor.status === 'Available' ? '🔒 Mark Rented' : '🔓 Mark Available'}
                    </button>
                    <button onClick={() => handleDelete(motor)} className="flex-1 min-w-[80px] py-2 px-2 rounded-lg text-xs font-bold cursor-pointer transition-colors bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-[rgba(5,8,16,0.85)] backdrop-blur-md flex justify-center items-center z-[100000] p-4" onClick={closeForm}>
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? 'Edit motorcycle' : 'Add new motorcycle'}
            className="bg-brand-card/95 backdrop-blur-xl border border-blue-500/15 rounded-3xl p-8 w-full max-w-[520px] max-h-[90vh] overflow-y-auto box-border shadow-[0_0_0_1px_rgba(59,130,246,0.04),0_30px_60px_rgba(0,0,0,0.6)] animate-[fadeInEffect_0.25s_ease-out]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-white text-xl font-bold">
                {editingId ? 'Edit Motorcycle' : 'Add New Motorcycle'}
              </h3>
              <button onClick={closeForm} aria-label="Close" className="bg-transparent border-none text-brand-muted text-2xl cursor-pointer leading-none hover:text-white transition-colors">&times;</button>
            </div>

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 p-2.5 rounded-lg text-[0.8rem] mb-4 break-words">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className={fieldLabelClass}>Motorcycle Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Yamaha NMAX V3" required className={fieldInputClass} />
              </div>

              <div>
                <label className={fieldLabelClass}>Description</label>
                <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description shown on the catalog card" className={`${fieldInputClass} resize-none`} />
              </div>

              <div>
                <label className={fieldLabelClass}>Tagline <span className="text-slate-500 font-normal">(optional, used on the homepage top-picks)</span></label>
                <input type="text" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="e.g. Comfort meets max performance." className={fieldInputClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabelClass}>Rate — 24 Hours (₱)</label>
                  <input type="number" min="0" value={form.rate_24hr} onChange={(e) => setForm({ ...form, rate_24hr: e.target.value })} required className={fieldInputClass} />
                </div>
                <div>
                  <label className={fieldLabelClass}>Rate — 12 Hours (₱)</label>
                  <input type="number" min="0" value={form.rate_12hr} onChange={(e) => setForm({ ...form, rate_12hr: e.target.value })} required className={fieldInputClass} />
                </div>
                <div>
                  <label className={fieldLabelClass}>Rate — 6 Hours (₱)</label>
                  <input type="number" min="0" value={form.rate_6hr} onChange={(e) => setForm({ ...form, rate_6hr: e.target.value })} required className={fieldInputClass} />
                </div>
                <div>
                  <label className={fieldLabelClass}>Rate — Per Hour (₱)</label>
                  <input type="number" min="0" value={form.rate_1hr} onChange={(e) => setForm({ ...form, rate_1hr: e.target.value })} required className={fieldInputClass} />
                </div>
              </div>

              <div>
                <label className={fieldLabelClass}>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={fieldInputClass}>
                  <option value="Available">Available</option>
                  <option value="Rented">Rented</option>
                </select>
              </div>

              <div>
                <span className={fieldLabelClass}>Specifications <span className="text-slate-500 font-normal">(optional — leave blank if unknown; the site will show "Contact us for details" instead of guessing)</span></span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={fieldLabelClass}>Engine</label>
                    <input type="text" value={form.engine_size} onChange={(e) => setForm({ ...form, engine_size: e.target.value })} placeholder="e.g. 125cc" className={fieldInputClass} />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Transmission</label>
                    <input type="text" value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })} placeholder="e.g. Automatic" className={fieldInputClass} />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Fuel Capacity</label>
                    <input type="text" value={form.fuel_capacity} onChange={(e) => setForm({ ...form, fuel_capacity: e.target.value })} placeholder="e.g. 4.2 L" className={fieldInputClass} />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Weight</label>
                    <input type="text" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="e.g. 98 kg" className={fieldInputClass} />
                  </div>
                </div>
              </div>

              <div>
                <label className={fieldLabelClass}>Photo {editingId ? '(leave blank to keep current photo)' : ''}</label>
                {imagePreview && (
                  <div className="w-full h-[140px] rounded-lg overflow-hidden border border-white/10 mb-2 bg-white/[0.03] flex items-center justify-center">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="text-slate-300 text-xs w-full file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-primary file:text-brand-bg file:font-bold file:cursor-pointer" />
              </div>

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={closeForm} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-lg text-white cursor-pointer text-sm font-semibold hover:bg-white/10 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-500 border-none rounded-lg text-white cursor-pointer text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Motorcycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <ConfirmDialog confirmState={confirmState} onCancel={() => setConfirmState(null)} />
    </div>
  );
}

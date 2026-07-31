import React, { useEffect, useState } from 'react';
import {
  KeyRoundIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  Trash2Icon,
  UserCogIcon } from
'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Field, Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useData } from '../../contexts/DataContext';
import { formatDate } from '../../lib/utils';
import type { User } from '../../lib/types';

interface FormState {
  name: string;
  username: string;
  email: string;
  mobile: string;
  password: string;
}

const empty: FormState = { name: '', username: '', email: '', mobile: '', password: '' };

export function ReceptionistsPage() {
  const { users, addUser, updateUser, deleteUser } = useData();
  const receptionists = users.filter((u) => u.role === 'RECEPTIONIST');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        username: editing.username,
        email: editing.email,
        mobile: editing.mobile,
        password: ''
      });
    } else {
      setForm(empty);
    }
  }, [editing, formOpen]);

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim() || !form.username.trim())
    return toast.error('Name and username are required.');
    const clash = users.find(
      (u) => u.username.toLowerCase() === form.username.trim().toLowerCase() && u.id !== editing?.id
    );
    if (clash) return toast.error('That username is already taken.');

    if (editing) {
      updateUser(editing.id, {
        name: form.name,
        username: form.username,
        email: form.email,
        mobile: form.mobile,
        ...(form.password ? { password: form.password } : {})
      });
      toast.success('Receptionist updated.');
    } else {
      if (!form.password) return toast.error('Password is required for new receptionists.');
      addUser({
        name: form.name,
        username: form.username,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        role: 'RECEPTIONIST',
        status: 'active'
      });
      toast.success('Receptionist created.');
    }
    setFormOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Receptionists"
        subtitle={`${receptionists.length} staff accounts`}
        action={
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}>
          
            <PlusIcon className="h-4 w-4" /> Add Receptionist
          </Button>
        } />
      

      <Card>
        {receptionists.length === 0 ?
        <EmptyState
          icon={UserCogIcon}
          title="No receptionists yet"
          description="Create staff accounts to help collect fees." /> :


        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Username</th>
                  <th className="px-6 py-3 font-semibold">Contact</th>
                  <th className="px-6 py-3 font-semibold">Created</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {receptionists.map((u) =>
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-600 dark:bg-violet-500/15">
                          {u.name[0]}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{u.username}</td>
                    <td className="px-6 py-3.5 text-slate-500">
                      <p>{u.email}</p>
                      <p className="text-xs text-slate-400">{u.mobile}</p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-3.5">
                      {u.status === 'active' ?
                  <Badge tone="green">Active</Badge> :

                  <Badge tone="slate">Inactive</Badge>
                  }
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn
                      label={u.status === 'active' ? 'Deactivate' : 'Activate'}
                      onClick={() => {
                        updateUser(u.id, { status: u.status === 'active' ? 'inactive' : 'active' });
                        toast.success(
                          `${u.name} ${u.status === 'active' ? 'deactivated' : 'activated'}.`
                        );
                      }}>
                      
                          <PowerIcon className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn
                      label="Reset password"
                      onClick={() => {
                        setResetTarget(u);
                        setNewPassword('');
                      }}>
                      
                          <KeyRoundIcon className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn
                      label="Edit"
                      onClick={() => {
                        setEditing(u);
                        setFormOpen(true);
                      }}>
                      
                          <PencilIcon className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn label="Delete" danger onClick={() => setDeleteTarget(u)}>
                          <Trash2Icon className="h-4 w-4" />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
      </Card>

      {/* Create/Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Receptionist' : 'Add Receptionist'}
        footer={
        <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editing ? 'Save Changes' : 'Create Account'}</Button>
          </>
        }>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name" required>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Username" required>
            <Input value={form.username} onChange={(e) => set('username', e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Mobile">
            <Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
          </Field>
          <Field label={editing ? 'New Password (optional)' : 'Password'} required={!editing} className="sm:col-span-2">
            <Input
              type="password"
              placeholder={editing ? 'Leave blank to keep current' : 'Set a password'}
              value={form.password}
              onChange={(e) => set('password', e.target.value)} />
            
          </Field>
        </div>
      </Modal>

      {/* Reset password modal */}
      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="Reset Password"
        subtitle={resetTarget?.name}
        size="sm"
        footer={
        <>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button
            onClick={() => {
              if (!newPassword) return toast.error('Enter a new password.');
              if (resetTarget) updateUser(resetTarget.id, { password: newPassword });
              toast.success('Password reset successfully.');
              setResetTarget(null);
            }}>
            
              Reset Password
            </Button>
          </>
        }>
        
        <Field label="New Password" required>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} />
          
        </Field>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteUser(deleteTarget.id);
            toast.success('Receptionist deleted.');
          }
        }}
        title="Delete receptionist?"
        message={`This will permanently remove ${deleteTarget?.name}'s account.`}
        confirmLabel="Delete" />
      
    </div>);

}

function IconBtn({
  children,
  label,
  onClick,
  danger





}: {children: React.ReactNode;label: string;onClick: () => void;danger?: boolean;}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
      danger ?
      'text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10' :
      'text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800'}`
      }>
      
      {children}
    </button>);

}
import React, { useEffect, useState } from 'react';
import {
  KeyRoundIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  Trash2Icon,
  UserCogIcon,
  MoreVerticalIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Field, Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  createReceptionist,
  deleteReceptionist,
  fetchReceptionists,
  updateReceptionist,
  type ReceptionistRecord,
} from '../../features/receptionists/receptionistsSlice';
import { formatDate } from '../../lib/utils';

interface FormState {
  name: string;
  email: string;
  mobile: string;
  password: string;
}

const empty: FormState = { name: '', email: '', mobile: '', password: '' };

export function ReceptionistsPage() {
  const dispatch = useAppDispatch();
  const receptionists = useAppSelector((state) => state.receptionists.items);
  const loading = useAppSelector((state) => state.receptionists.loading);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReceptionistRecord | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [deleteTarget, setDeleteTarget] = useState<ReceptionistRecord | null>(null);
  const [resetTarget, setResetTarget] = useState<ReceptionistRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    void dispatch(fetchReceptionists());
  }, [dispatch]);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        email: editing.email,
        mobile: editing.mobile,
        password: '',
      });
    } else {
      setForm(empty);
    }
  }, [editing, formOpen]);

  const set = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = () => {
    if (!form.name.trim() || !form.mobile.trim() || !form.email.trim()) {
      return toast.error('Name, email and mobile are required.');
    }

    if (editing) {
      void dispatch(
        updateReceptionist({
          id: editing._id,
          payload: {
            name: form.name,
            email: form.email,
            mobile: form.mobile,
            ...(form.password ? { password: form.password } : {}),
          },
        })
      ).then(() => dispatch(fetchReceptionists()));
      toast.success('Receptionist updated.');
    } else {
      if (!form.password) return toast.error('Password is required for new receptionists.');
      void dispatch(
        createReceptionist({
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          password: form.password,
        })
      ).then(() => dispatch(fetchReceptionists()));
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
            }}
          >
            <PlusIcon className="h-4 w-4" /> Add Receptionist
          </Button>
        }
      />

      <Card>
        {loading ? (
          <p className="px-6 py-10 text-sm text-slate-500">Loading receptionists...</p>
        ) : receptionists.length === 0 ? (
          <EmptyState
            icon={UserCogIcon}
            title="No receptionists yet"
            description="Create staff accounts to help collect fees."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Contact</th>
                  <th className="px-6 py-3 font-semibold">Created</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {receptionists.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-600 dark:bg-violet-500/15">
                          {user.name[0]}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      <p>{user.email}</p>
                      <p className="text-xs text-slate-400">{user.mobile}</p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-3.5">
                      {user.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Inactive</Badge>}
                    </td>
                    <td className="px-6 py-3.5">
                      <ReceptionistMenu
                        user={user}
                        onEdit={() => {
                          setEditing(user);
                          setFormOpen(true);
                        }}
                        onToggle={() => {
                          void dispatch(
                            updateReceptionist({
                              id: user._id,
                              payload: {
                                name: user.name,
                                email: user.email,
                                mobile: user.mobile,
                              },
                            })
                          ).then(() => dispatch(fetchReceptionists()));
                          toast.success(`${user.name} status updated.`);
                        }}
                        onReset={() => {
                          setResetTarget(user);
                          setNewPassword('');
                        }}
                        onDelete={() => setDeleteTarget(user)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name" required>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Mobile" required>
            <Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
          </Field>
          <Field label={editing ? 'New Password (optional)' : 'Password'} required={!editing} className="sm:col-span-2">
            <Input
              type="password"
              placeholder={editing ? 'Leave blank to keep current' : 'Set a password'}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </Field>
        </div>
      </Modal>

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
                if (resetTarget) {
                  void dispatch(
                    updateReceptionist({
                      id: resetTarget._id,
                      payload: {
                        name: resetTarget.name,
                        email: resetTarget.email,
                        mobile: resetTarget.mobile,
                        password: newPassword,
                      },
                    })
                  ).then(() => dispatch(fetchReceptionists()));
                }
                toast.success('Password reset successfully.');
                setResetTarget(null);
              }}
            >
              Reset Password
            </Button>
          </>
        }
      >
        <Field label="New Password" required>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </Field>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void dispatch(deleteReceptionist(deleteTarget._id)).then(() => dispatch(fetchReceptionists()));
            toast.success('Receptionist deleted.');
          }
        }}
        title="Delete receptionist?"
        message={`This will permanently remove ${deleteTarget?.name}'s account.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

function ReceptionistMenu({
  user,
  onEdit,
  onToggle,
  onReset,
  onDelete,
}: {
  user: ReceptionistRecord;
  onEdit: () => void;
  onToggle: () => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
        aria-label="Actions"
      >
        <MoreVerticalIcon className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <button onClick={onToggle} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
            <PowerIcon className="h-4 w-4 text-violet-500" />
            {user.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={onReset} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
            <KeyRoundIcon className="h-4 w-4 text-amber-500" />
            Reset password
          </button>
          <button onClick={onEdit} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
            <PencilIcon className="h-4 w-4 text-blue-500" />
            Edit
          </button>
          <button onClick={onDelete} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10">
            <Trash2Icon className="h-4 w-4 text-rose-500" />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

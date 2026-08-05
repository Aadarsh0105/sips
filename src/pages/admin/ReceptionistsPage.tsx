import { useEffect, useState } from 'react';
import {
  EyeIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UserCogIcon,
  MoreVerticalIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import * as yup from 'yup';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Field, Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useExclusiveMenu } from '../../hooks/useExclusiveMenu';
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

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().required('Email is required').email('Enter a valid email address'),
  mobile: yup.string().required('Mobile is required').matches(/^[0-9]{10}$/, 'Enter a valid 10-digit mobile number'),
  password: yup.string().when('$editing', {
    is: false,
    then: (rule) => rule.required('Password is required'),
    otherwise: (rule) => rule.notRequired(),
  }),
});

export function ReceptionistsPage() {
  const dispatch = useAppDispatch();
  const receptionists = useAppSelector((state) => state.receptionists.items);
  const loading = useAppSelector((state) => state.receptionists.loading);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReceptionistRecord | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [deleteTarget, setDeleteTarget] = useState<ReceptionistRecord | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});

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
    setShowPassword(false);
    setFormErrors({});
  }, [editing, formOpen]);

  const set = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    try {
      await schema.validate(form, { abortEarly: false, context: { editing: !!editing } });
      setFormErrors({});

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
    } catch (error: any) {
      if (error?.inner) {
        const nextErrors: Partial<Record<keyof FormState, string>> = {};
        for (const item of error.inner) {
          if (item.path) nextErrors[item.path as keyof FormState] = item.message;
        }
        setFormErrors(nextErrors);
      }
    }
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
          <div className="overflow-x-auto lg:overflow-visible">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Mobile</th>
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Created</th>
                  {/* <th className="px-6 py-3 font-semibold">Status</th> */}
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
                      <p>{user.mobile}</p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      <p>{user.email}</p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{formatDate(user.createdAt)}</td>
                    {/* <td className="px-6 py-3.5">
                      {user.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Inactive</Badge>}
                    </td> */}
                    <td className="px-6 py-3.5">
                      <ReceptionistMenu
                        menuId={`receptionists-action-menu-${user._id}`}
                        user={user}
                        onEdit={() => {
                          setEditing(user);
                          setFormOpen(true);
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
            {formErrors.name ? <p className="mt-1 text-xs text-rose-500">{formErrors.name}</p> : null}
          </Field>
          <Field label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            {formErrors.email ? <p className="mt-1 text-xs text-rose-500">{formErrors.email}</p> : null}
          </Field>
          <Field label="Mobile" required>
            <Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
            {formErrors.mobile ? <p className="mt-1 text-xs text-rose-500">{formErrors.mobile}</p> : null}
          </Field>
          <Field label={editing ? 'New Password (optional)' : 'Password'} required={!editing}>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={editing ? 'Leave blank to keep current' : 'Set a password'}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon className="h-4 w-4" />
              </button>
            </div>
            {formErrors.password ? <p className="mt-1 text-xs text-rose-500">{formErrors.password}</p> : null}
          </Field>
        </div>
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
  menuId,
  onEdit,
  onDelete,
}: {
  menuId: string;
  user: ReceptionistRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { rootRef, open, toggle, close } = useExclusiveMenu(menuId);

  return (
    <div ref={rootRef} className="relative flex justify-end">
      <button
        type="button"
        onClick={toggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
        aria-label="Actions"
      >
        <MoreVerticalIcon className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <button
            onClick={() => {
              close();
              onEdit();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <PencilIcon className="h-4 w-4 text-blue-500" />
            Edit
          </button>
          <button
            onClick={() => {
              close();
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            <Trash2Icon className="h-4 w-4 text-rose-500" />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

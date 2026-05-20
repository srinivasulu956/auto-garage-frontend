export const ROLE_META = {
	Admin: { bg: '#eff6ff', color: '#1d4ed8', label: 'Admin' },
	Mechanic: { bg: '#fdf4ff', color: '#7e22ce', label: 'Mechanic' },
};

export const EMPTY_STAFF_FORM = { firstName: '', lastName: '', email: '', password: '', role: 'Mechanic' };

export const getRoleMeta = (role) => ROLE_META[role] || { bg: '#f3f4f6', color: '#374151', label: role };

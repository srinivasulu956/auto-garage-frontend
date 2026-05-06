// export const menuConfig = {
// 	admin: [
// 		{
// 			id: 'dashboard',
// 			label: 'Dashboard',
// 			icon: 'D',
// 			path: 'dashboard',
// 		},
// 		{
// 			id: 'management',
// 			label: 'Management',
// 			icon: 'M',
// 			path: 'management',
// 			children: [
// 				{
// 					id: 'admin-bookings',
// 					label: 'Bookings',
// 					icon: 'B',
// 					path: 'bookings',
// 				},
// 				{
// 					id: 'admin-services',
// 					label: 'Services',
// 					icon: 'S',
// 					path: 'services',
// 				},
// 				{
// 					id: 'admin-staff',
// 					label: 'Staff',
// 					icon: 'T',
// 					path: 'staff',
// 				},
// 				{
// 					id: 'admin-details',
// 					label: 'Admin Details',
// 					icon: 'A',
// 					path: 'details',
// 				},
// 			],
// 		},
// 	],

// 	customer: [
// 		{
// 			id: 'dashboard',
// 			label: 'Dashboard',
// 			icon: 'D',
// 			path: 'dashboard',
// 		},
// 		{
// 			id: 'garage',
// 			label: 'My Garage',
// 			icon: 'G',
// 			path: 'garage',
// 			children: [
// 				{
// 					id: 'vehicles',
// 					label: 'Vehicles',
// 					icon: 'V',
// 					path: 'vehicles',
// 				},
// 				{
// 					id: 'bookings',
// 					label: 'Bookings',
// 					icon: 'B',
// 					path: 'bookings',
// 				},
// 				{
// 					id: 'invoices',
// 					label: 'Invoices',
// 					icon: 'I',
// 					path: 'invoices',
// 				},
// 			],
// 		},
// 		{
// 			id: 'profile',
// 			label: 'Profile',
// 			icon: 'P',
// 			path: 'details',
// 		},
// 	],

// 	mechanic: [
// 		{
// 			id: 'dashboard',
// 			label: 'Dashboard',
// 			icon: 'D',
// 			path: 'dashboard',
// 		},
// 		{
// 			id: 'work',
// 			label: 'Workshop',
// 			icon: 'W',
// 			path: 'workshop',
// 			children: [
// 				{
// 					id: 'jobs',
// 					label: 'Assigned Jobs',
// 					icon: 'J',
// 					path: 'jobs',
// 				},
// 				{
// 					id: 'mechanic-details',
// 					label: 'Details',
// 					icon: 'M',
// 					path: 'details',
// 				},
// 			],
// 		},
// 	],
// };

export const menuConfig = {
	admin: [
		{
			id: 'dashboard',
			label: 'Dashboard',
			icon: 'D',
			path: 'dashboard',
		},
		{
			id: 'admin-bookings',
			label: 'Bookings',
			icon: 'B',
			path: 'bookings',
		},
		{
			id: 'admin-services',
			label: 'Services',
			icon: 'S',
			path: 'services',
		},
		{
			id: 'admin-staff',
			label: 'Staff',
			icon: 'T',
			path: 'staff',
		},
		{
			id: 'admin-customers',
			label: 'Customers',
			icon: 'C',
			path: 'customers',
		},
		{
			id: 'admin-details',
			label: 'Admin Details',
			icon: 'A',
			path: 'details',
		},
	],

	customer: [
		{
			id: 'dashboard',
			label: 'Dashboard',
			icon: 'D',
			path: 'dashboard',
		},
		{
			id: 'garage',
			label: 'My Garage',
			icon: 'G',
			path: 'vehicles',
		},

		// ─────────────────────────────
		// BOOKINGS (WITH CHILDREN ONLY HERE)
		// ─────────────────────────────
		{
			id: 'customer-bookings',
			label: 'Bookings',
			icon: 'B',
			path: 'bookings',
			children: [
				{
					id: 'customer-my-bookings',
					label: 'My Bookings',
					icon: 'M',
					path: 'bookings',
				},
				{
					id: 'customer-invoices',
					label: 'Invoices',
					icon: 'I',
					path: 'invoices',
				},
			],
		},

		{
			id: 'profile',
			label: 'Profile',
			icon: 'P',
			path: 'details',
		},
	],

	mechanic: [
		{
			id: 'dashboard',
			label: 'Dashboard',
			icon: 'D',
			path: 'dashboard',
		},
		{
			id: 'work',
			label: 'Workshop',
			icon: 'W',
			path: 'workshop',
			children: [
				{
					id: 'jobs',
					label: 'Assigned Jobs',
					icon: 'J',
					path: 'jobs',
				},
				{
					id: 'mechanic-details',
					label: 'Details',
					icon: 'M',
					path: 'details',
				},
			],
		},
	],
};

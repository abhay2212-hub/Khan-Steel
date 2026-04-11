export const defaultProjects = [
    {
        id: 'p1',
        title: 'Architectural Gates',
        meta: 'Varanasi Estates • 2024',
        description: 'High-integrity laser-cut entrance gates featuring specialized anti-corrosion coatings and monolithic modern design.',
        image: './as/6.webp',
        delay: 0
    },
    {
        id: 'p2',
        title: 'Luxury Steel Railings',
        meta: 'Prime Residences • 2024',
        description: 'Bespoke stainless steel and glass railings engineered for maximum structural safety and minimalist architectural appeal.',
        image: './as/7.jpg',
        delay: 100
    },
    {
        id: 'p3',
        title: 'Modern Steel Windows',
        meta: 'Modernist Manor • 2024',
        description: 'Ultra-slim architectural steel window frames, providing monolithic structural support and expansive panoramic views.',
        image: './as/4.webp',
        delay: 200
    },
    {
        id: 'p4',
        title: 'Safety Grills',
        meta: 'High-Security Homes • 2024',
        description: 'Bespoke laser-cut safety grilles that integrate industrial-grade security with premium residential aesthetics.',
        image: './as/5.webp',
        delay: 300
    }
];

// ── Fetch projects from Supabase via API ─────────────────────
export async function getProjects() {
    try {
        const res = await fetch('/api/projects');
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) return data;
        }
    } catch (e) {
        console.error("Failed to fetch projects from Supabase", e);
    }
    return defaultProjects;
}

export async function addProject(project) {
    try {
        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
        });
        if (!res.ok) throw new Error("Failed to add project");
        return await res.json();
    } catch(e) {
        console.error(e);
    }
}

export async function removeProject(id) {
    try {
        const res = await fetch(`/api/projects/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to remove project");
    } catch(e) {
        console.error(e);
    }
}

// ── Project Items CRUD ───────────────────────────────────────
export async function getProjectItems(projectId) {
    try {
        const res = await fetch(`/api/projects/${projectId}/items`);
        if (res.ok) return await res.json();
    } catch (e) {
        console.error("Failed to fetch project items", e);
    }
    return [];
}

export async function addProjectItem(projectId, item) {
    try {
        const res = await fetch(`/api/projects/${projectId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        if (!res.ok) throw new Error("Failed to add item");
        return await res.json();
    } catch(e) {
        console.error(e);
    }
}

export async function updateProjectItem(projectId, itemId, updates) {
    try {
        const res = await fetch(`/api/projects/${projectId}/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error("Failed to update item");
        return await res.json();
    } catch(e) {
        console.error(e);
    }
}

export async function removeProjectItem(projectId, itemId) {
    try {
        const res = await fetch(`/api/projects/${projectId}/items/${itemId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to remove item");
    } catch(e) {
        console.error(e);
    }
}

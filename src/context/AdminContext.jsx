import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../config/supabase';

const AdminContext = createContext(null);

let nextCompanyId = 100;
let nextUserId = 100;

export function AdminProvider({ children, currentUser }) {
    // DB table: companies(id, name, logo_url, status, created_at)
    const [companies, setCompanies] = useState([]);
    const [loadingCompanies, setLoadingCompanies] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        if (currentUser.role === 'super_admin') {
            fetchCompanies();
            fetchUsers();
        } else {
            setLoadingCompanies(false);
            fetchUsers();
        }
    }, [currentUser]);

    const fetchCompanies = async () => {
        setLoadingCompanies(true);
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            const mapped = data.map(c => ({
                id: c.id,
                name: c.name,
                logoUrl: c.logo_url,
                status: c.status,
                createdAt: new Date(c.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
                rawTs: new Date(c.created_at).getTime()
            }));
            setCompanies(mapped);
        }
        setLoadingCompanies(false);
    };

    // DB table: profiles(id, email, name, role, company_id, status, ...)
    const [allUsers, setAllUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

            // Si el usuario no es super_admin, filtramos solo los usuarios de su empresa
            if (currentUser?.role !== 'super_admin') {
                query = query.eq('company_id', currentUser.companyId);
            }

            const { data, error } = await query;
            if (!error && data) {
                const mapped = data.map(u => ({
                    id: u.id,
                    email: u.email,
                    name: u.name,
                    role: u.role,
                    companyId: u.company_id,
                    status: u.status,
                    avatarUrl: u.avatar_url,
                    createdAt: new Date(u.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
                }));
                setAllUsers(mapped);
            }
        } catch (error) {
            console.error('Error al hacer fetch a profiles:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    // ─── Company Actions ─────────────────────────────────────────────────────
    const addCompany = async ({ name, logoFile = null, status = 'Activo' }) => {
        let logoUrl = null;

        if (logoFile) {
            const fileExt = logoFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('companies-logos')
                .upload(filePath, logoFile);

            if (uploadError) {
                console.error('Error subiendo el logo de la empresa:', uploadError);
                throw new Error('No se pudo subir el logo. Verifica que el bucket "companies-logos" exista y sea público.');
            }

            const { data: publicUrlData } = supabase.storage
                .from('companies-logos')
                .getPublicUrl(filePath);

            logoUrl = publicUrlData.publicUrl;
        }

        const { data, error } = await supabase
            .from('companies')
            .insert([{
                name,
                logo_url: logoUrl,
                status
            }])
            .select()
            .single();

        if (error) {
            console.error('Error insertando la compañia en Supabase:', error);
            throw new Error(error.message || 'Error al guardar la empresa en la base de datos.');
        }

        // Actualizar UI localmente
        const newCompany = {
            id: data.id,
            name: data.name,
            logoUrl: data.logo_url,
            status: data.status,
            createdAt: new Date(data.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
            rawTs: new Date(data.created_at).getTime()
        };

        setCompanies(prev => [newCompany, ...prev]);
        return newCompany;
    };

    // DB: UPDATE companies SET status = ? WHERE id = ?
    const toggleCompanyStatus = async (companyId) => {
        const company = companies.find(c => c.id === companyId);
        if (!company) return;
        const newStatus = company.status === 'Activo' ? 'Inactivo' : 'Activo';

        const { error } = await supabase.from('companies').update({ status: newStatus }).eq('id', companyId);
        if (error) {
            console.error('Error actualizando estado de la empresa:', error);
            return;
        }

        setCompanies(prev => prev.map(c =>
            c.id === companyId
                ? { ...c, status: newStatus }
                : c
        ));
    };

    // DB: UPDATE companies SET name = ?, logo_url = ? WHERE id = ?
    const updateCompany = async (companyId, updates) => {
        const { error } = await supabase.from('companies').update(updates).eq('id', companyId);
        if (error) {
            console.error('Error actualizando datos de empresa:', error);
            return;
        }

        setCompanies(prev => prev.map(c =>
            c.id === companyId ? { ...c, ...updates } : c
        ));
    };

    // ─── User Actions ────────────────────────────────────────────────────────
    const addUser = async ({ email, name, role, companyId, companyName, password, avatarFile = null }) => {
        const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        let avatarUrl = null;

        // 1. Subir Avatar a Storage si existe
        if (avatarFile) {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `profiles/${fileName}`; // bucket avatars

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile);

            if (uploadError) {
                console.error('Error subiendo avatar:', uploadError);
                throw new Error('No se pudo subir la foto de perfil. Verifica el bucket "avatars".');
            }

            const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            avatarUrl = publicUrlData.publicUrl;
        }

        // 2. Registrar el usuario en Auth usando el cliente secundario
        const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
            email,
            password,
        });

        if (authError || !authData?.user) {
            console.error('Error creando usuario en Auth:', authError);
            throw new Error(authError?.message || 'Error al registrar el correo en la base de datos.');
        }

        const userId = authData.user.id;

        // 3. Insertar en public.profiles
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: userId,
                email,
                name,
                role,
                company_id: companyId,
                status: 'Activo',
                avatar_url: avatarUrl
            }]);

        if (profileError) {
            console.error('Error insertando en profiles:', profileError);
            throw new Error('El usuario se creó en Auth pero falló al crear el perfil público.');
        }

        // 4. Insertar en tabla específica de rol (clients o agents)
        if (role === 'client') {
            const { error: clientError } = await supabase.from('clients').insert([{
                profile_id: userId,
                company_id: companyId,
                name,
                initials
            }]);
            if (clientError) console.error('Error insertando client:', clientError);
        } else {
            const { error: agentError } = await supabase.from('agents').insert([{
                profile_id: userId,
                company_id: companyId,
                initials
            }]);
            if (agentError) console.error('Error insertando agent:', agentError);
        }

        // 5. Actualizar interfaz local (aislamiento temporal)
        const newUser = {
            id: userId,
            email,
            name,
            role,
            companyId,
            companyName,
            status: 'Activo',
            initials,
            avatarUrl,
            agentId: role !== 'client' ? userId : null,
            clientId: role === 'client' ? userId : null,
        };

        setAllUsers(prev => [newUser, ...prev]);
        return newUser;
    };


    // DB: UPDATE profiles SET status = ? WHERE id = ?
    const toggleUserStatus = async (userId) => {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;
        const newStatus = user.status === 'Activo' ? 'Inactivo' : 'Activo';

        const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
        if (error) {
            console.error('Error actualizando estado del usuario:', error);
            return;
        }

        setAllUsers(prev => prev.map(u =>
            u.id === userId
                ? { ...u, status: newStatus }
                : u
        ));
    };

    // ─── Derived helpers ─────────────────────────────────────────────────────
    // Users belonging to a specific company (for admin_empresa Settings view)
    const getUsersByCompany = (companyId) =>
        allUsers.filter(u => u.companyId === companyId);

    const getAgentsByCompany = (companyId) =>
        allUsers.filter(u => u.companyId === companyId && u.role !== 'client');

    const getClientsByCompany = (companyId) =>
        allUsers.filter(u => u.companyId === companyId && u.role === 'client');

    // User count per company (for super_admin table)
    const getUserCountByCompany = (companyId) =>
        allUsers.filter(u => u.companyId === companyId).length;

    return (
        <AdminContext.Provider value={{
            companies,
            loadingCompanies,
            allUsers,
            currentUser,                    // DB: auth.users + profiles
            addCompany,
            toggleCompanyStatus,
            updateCompany,
            addUser,
            toggleUserStatus,
            getUsersByCompany,
            getAgentsByCompany,
            getClientsByCompany,
            getUserCountByCompany,
            fetchCompanies,
            fetchUsers,
        }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const ctx = useContext(AdminContext);
    if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
    return ctx;
}


export const DummyDB = {
  getComplaints: (userId?: string) => {
    try {
      const all = JSON.parse(localStorage.getItem('vizor_complaints') || '[]');
      if (userId) return all.filter((c: any) => c.submitted_by === userId);
      return all;
    } catch {
      return [];
    }
  },
  addComplaint: (c: any) => {
    try {
      const all = JSON.parse(localStorage.getItem('vizor_complaints') || '[]');
      const newC = {
        ...c,
        id: crypto.randomUUID(),
        complaint_code: `RSY-${new Date().getFullYear()}-${Math.floor(Math.random()*90000)+10000}`,
        status: 'Pending',
        created_at: new Date().toISOString(),
      };
      // add to top
      all.unshift(newC);
      localStorage.setItem('vizor_complaints', JSON.stringify(all));
      return newC;
    } catch {
      return null;
    }
  }
};

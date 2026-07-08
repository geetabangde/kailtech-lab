import { useState, useEffect } from 'react';
import axios from 'utils/axios';
import { useAuthContext } from 'app/contexts/auth/context';

export const useFetchLabs = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    const fetchLabs = async () => {
      if (!isAuthenticated) return; // Wait until authenticated
      
      try {
        setLoading(true);
        
        const response = await axios.get('/master/list-lab');
        
        // Extract data from response
        const labsData = response.data?.data || [];
        
        if (!Array.isArray(labsData)) {
          throw new Error('Invalid data format from API');
        }
        
        // Map to required format
        const mappedLabs = labsData.map(lab => {
          const slug = (lab.name || '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[()]/g, '')
            .replace(/[^\w-]/g, '');
          
          return {
            id: lab.id,
            name: lab.name || 'Unknown Lab',
            slug: slug || `lab-${lab.id}`,
            users: lab.users ? lab.users.split(',').map(Number) : [],
          };
        });
        
        setLabs(mappedLabs);
        setError(null);
      } catch (err) {
        console.error('Error fetching labs:', err);
        setError(err.response?.data?.message || err.message);
        setLabs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLabs();
  }, [isAuthenticated]);

  return { labs, loading, error };
};

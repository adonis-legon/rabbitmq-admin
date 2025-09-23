import { useState, useEffect, useCallback } from 'react';

interface UseDebouncedSearchOptions {
    delay?: number;
    minLength?: number;
}

export const useDebouncedSearch = (
    initialValue: string = '',
    options: UseDebouncedSearchOptions = {}
) => {
    const { delay = 300, minLength = 0 } = options;

    const [searchTerm, setSearchTerm] = useState(initialValue);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        setIsSearching(true);

        const handler = setTimeout(() => {
            if (searchTerm.length >= minLength) {
                setDebouncedSearchTerm(searchTerm);
            } else {
                setDebouncedSearchTerm('');
            }
            setIsSearching(false);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, delay, minLength]);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setDebouncedSearchTerm('');
        setIsSearching(false);
    }, []);

    return {
        searchTerm,
        debouncedSearchTerm,
        isSearching,
        setSearchTerm,
        clearSearch,
    };
};
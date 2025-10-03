import React, { createContext, useState, useContext, ReactNode } from 'react';

// Crie o contexto com valores iniciais
const SearchContext = createContext({
  searchText: '',
  isSearching: false,
  isFilteringDate: false,
  showDatePicker: false,
  selectedDate: new Date(),
  setSearchText: (text: string) => {},
  setIsSearching: (state: boolean) => {},
  setIsFilteringDate: (state: boolean) => {},
  setShowDatePicker: (state: boolean) => {},
  setSelectedDate: (date: Date) => {},
});

export const SearchProvider = ({ children }) => {
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFilteringDate, setIsFilteringDate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const value = {
    searchText,
    isSearching,
    isFilteringDate,
    showDatePicker,
    selectedDate,
    setSearchText,
    setIsSearching,
    setIsFilteringDate,
    setShowDatePicker,
    setSelectedDate,
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = () => {
  return useContext(SearchContext);
};
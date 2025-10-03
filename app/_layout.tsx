import 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Pressable, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSearch, SearchProvider } from '../context/SearchContext';
import { useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

const CustomHeader = () => {
  const {
    isSearching,
    setIsSearching,
    searchText,
    setSearchText,
    showDatePicker,
    setShowDatePicker,
    isFilteringDate,
    setIsFilteringDate,
    setSelectedDate,
  } = useSearch();

  const handleSearchToggle = () => {
    setIsSearching(!isSearching);
    if (isSearching) {
      setSearchText('');
      setIsFilteringDate(false);
    }
  };

  const handleDateFilter = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      setIsFilteringDate(true);
      setIsSearching(false);
    }
  };

  const handleClearFilter = () => {
    setIsFilteringDate(false);
    setIsSearching(false);
    setSearchText('');
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
      {isSearching ? (
        <TextInput
          style={{ flex: 1, height: 40, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingLeft: 10, marginRight: 10, width: 250 }}
          placeholder="Buscar por ração..."
          value={searchText}
          onChangeText={setSearchText}
        />
      ) : (
        <View style={{ flexDirection: 'row' }}>
          <Pressable onPress={() => setShowDatePicker(true)} style={{ marginRight: 20 }}>
            <Ionicons name="calendar-outline" size={24} color="#000" />
          </Pressable>
          <Pressable onPress={handleSearchToggle}>
            <Ionicons name="search-outline" size={24} color="#000" />
          </Pressable>
        </View>
      )}
      {(isSearching || isFilteringDate) && (
        <Pressable onPress={handleClearFilter} style={{ marginLeft: 15 }}>
          <Ionicons name="close-outline" size={24} color="#000" />
        </Pressable>
      )}

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={new Date()}
          mode={'date'}
          display="default"
          onChange={handleDateFilter}
        />
      )}
    </View>
  );
};

export default function Layout() {
  return (
    <SearchProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer>
          {/* Rotas visíveis no menu */}
          <Drawer.Screen
            name="index"
            options={{
              title: 'Histórico',
              headerRight: () => <CustomHeader />,
              headerStyle: { backgroundColor: '#fff' },
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          />
          <Drawer.Screen
            name="GraficosPage"
            options={{
              drawerLabel: 'Gráficos',
              title: 'Gráficos',
            }}
          />

          {/* Rota oculta do menu */}
          <Drawer.Screen
            name="+not-found"
            options={{
              title: 'Página não encontrada',
              drawerItemStyle: { display: 'none' },
            }}
          />
        </Drawer>
      </GestureHandlerRootView>
    </SearchProvider>
  );
}
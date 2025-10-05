import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SectionList, TouchableOpacity, TextInput, Modal, Alert, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSearch } from '../context/SearchContext';

// Lógica de agrupamento por data
const agruparVendasParaSectionList = (vendas) => {
  const dadosAgrupados = vendas.reduce((grupos, venda) => {
    const data = venda.data;
    if (!grupos[data]) {
      grupos[data] = [];
    }
    grupos[data].push(venda);
    return grupos;
  }, {});

  const secoes = Object.keys(dadosAgrupados)
    .sort((a, b) => {
      // Ordena as datas de forma decrescente (mais recente primeiro)
      const [diaA, mesA, anoA] = a.split('/').map(Number);
      const [diaB, mesB, anoB] = b.split('/').map(Number);
      return new Date(anoB, mesB - 1, diaB) - new Date(anoA, mesA - 1, diaA);
    })
    .map((data) => ({
      title: data,
      data: dadosAgrupados[data],
    }));

  return secoes;
};

export default function App() {
  // Use os estados e a lógica do Contexto
  const { searchText, isSearching, isFilteringDate, selectedDate } = useSearch();

  const [modalVisible, setModalVisible] = useState(false);
  const [vendas, setVendas] = useState([]);
  const [agua, setAgua] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [preco, setPreco] = useState('');
  const [data, setData] = useState('');
  const [showModalDatePicker, setShowModalDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  useEffect(() => {
    carregarVendas();
  }, []);

  const carregarVendas = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('vendas');
      if (jsonValue != null) {
        setVendas(JSON.parse(jsonValue));
      }
    } catch (e) {
      console.error('Erro ao carregar vendas:', e);
    }
  };

  const handleSalvarVenda = async () => {
      if (!agua || !quantidade || !preco || !data) {
        Alert.alert("Erro", "Por favor, preencha todos os campos.");
        return;
      }

      // --- Início das Alterações ---
      // 1. Limpa e converte o peso para um float.
      //    - Substitui vírgula por ponto para o formato numérico.
      const quantidadeLimpo = quantidade.replace(',', '.')
      const quantidadeFloat = parseFloat(quantidadeLimpo);

      // 2. Limpa e converte o preço para um float.
      //    - Substitui vírgula por ponto para o formato numérico.
      const precoLimpo = preco.replace(',', '.').trim();
      const precoFloat = parseFloat(precoLimpo);

      // 3. Valida se a conversão foi bem-sucedida.
      if (isNaN(quantidadeFloat) || isNaN(precoFloat)) {
        Alert.alert("Erro", "Quantidade e preço devem ser valores numéricos válidos.");
        return;
      }

      let novaListaVendas;
      if (isEditing) {
        novaListaVendas = vendas.map(venda =>
          venda.id === editingItemId
            ? { ...venda, agua, quantidade: quantidadeFloat, valor: precoFloat, data, isEdited: true }
            : venda
        );
        Alert.alert("Sucesso", "Venda editada com sucesso!");
      } else {
        const novaVenda = {
          id: Date.now().toString(),
          agua,
          quantidade: quantidadeFloat,
          valor: precoFloat,
          data,
        };
        novaListaVendas = [...vendas, novaVenda];
        Alert.alert("Sucesso", "Venda salva com sucesso!");
      }

      try {
        const jsonValue = JSON.stringify(novaListaVendas);
        await AsyncStorage.setItem('vendas', jsonValue);
        setVendas(novaListaVendas);
        handleCancelar();
      } catch (e) {
        console.error('Erro ao salvar venda:', e);
        Alert.alert("Erro", "Não foi possível salvar a venda.");
      }
    };

  const handleCancelar = () => {
    setAgua('');
    setQuantidade('');
    setPreco('');
    setData('');
    setEditingItemId(null);
    setIsEditing(false);
    setModalVisible(false);
  };

  const handleEditVenda = (item) => {
    setIsEditing(true);
    setEditingItemId(item.id);
    setAgua(item.agua);
    setQuantidade(item.quantidade.toString());
    setPreco(item.valor.toString());
    setData(item.data);
    setModalVisible(true);
  };

  const onModalDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowModalDatePicker(Platform.OS === 'ios');
    const dataFormatada = currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    setData(dataFormatada);
  };

  const getFilteredVendas = () => {
    if (isSearching && searchText.trim() !== '') {
      return vendas.filter(venda =>
        venda.agua.toLowerCase().includes(searchText.toLowerCase())
      ).sort((a, b) => {
        const [diaA, mesA, anoA] = a.data.split('/').map(Number);
        const [diaB, mesB, anoB] = b.data.split('/').map(Number);
        return new Date(anoB, mesB - 1, diaB) - new Date(anoA, mesA - 1, diaA);
      });
    }

    if (isFilteringDate && selectedDate) {
      const dataFormatada = selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return vendas.filter(venda => venda.data === dataFormatada);
    }

    return vendas;
  };

  const vendasExibidas = getFilteredVendas();
  const SECTIONS = agruparVendasParaSectionList(vendasExibidas);

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleEditVenda(item)} style={styles.vendaItem}>
      <Text style={styles.aguaNome}>{item.agua}</Text>
      <Text>Qtd. {item.quantidade} R$ {item.valor}</Text>
      {item.isEdited && <Text style={styles.editedLabel}>Editado</Text>}
    </TouchableOpacity>
  );

  // função para renderizar itens filtrados
  const renderFilteredItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleEditVenda(item)} style={styles.vendaItem}>
        <Text style={styles.aguaNome}>{item.agua}</Text>
        <Text>Data: {item.data}</Text>
        <Text>Qtd. {item.quantidade} R$ {item.valor}</Text>
        {item.isEdited && <Text style={styles.editedLabel}>Editado</Text>}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <View style={styles.container}>
      {isSearching || isFilteringDate ? (
        <FlatList
          data={vendasExibidas}
          keyExtractor={(item) => item.id}
          renderItem={renderFilteredItem}
          style={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text>Nenhum resultado encontrado.</Text>
            </View>
          )}
        />
      ) : (
        <SectionList
          sections={SECTIONS}
          keyExtractor={(item, index) => item.id + index}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          style={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text>Nenhuma venda registrada ainda!</Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setIsEditing(false);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add-outline" size={35} color="#FFF" />
      </TouchableOpacity>
      {/* ... Modal ... */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{isEditing ? "Editar Venda" : "Nova Venda"}</Text>
            <Text style={styles.modalSubTitle}>Agua</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome da agua"
              onChangeText={setAgua}
              value={agua}
            />
            <Text style={styles.modalSubTitle}>Quantidade</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 3"
              onChangeText={setQuantidade}
              value={quantidade}
            />
            <Text style={styles.modalSubTitle}>Preço</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 22,50"
              onChangeText={setPreco}
              value={preco}
              keyboardType="numeric"
            />
            <Text style={styles.modalSubTitle}>Data</Text>
            <TouchableOpacity onPress={() => setShowModalDatePicker(true)}>
              <View style={[styles.input, { justifyContent: 'center' }]}>
                <Text>{data ? data : "Selecione a data"}</Text>
              </View>
            </TouchableOpacity>
            {showModalDatePicker && (
              <DateTimePicker
                testID="modalDateTimePicker"
                value={new Date()}
                mode="date"
                display="default"
                onChange={onModalDateChange}
              />
            )}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.buttonCancelar]}
                onPress={handleCancelar}
              >
                <Text style={styles.textStyle}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.buttonSalvar]}
                onPress={handleSalvarVenda}
              >
                <Text style={styles.textStyle}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  listContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  vendaItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  aguaNome: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  addButton: {
    position: 'absolute',
    bottom: 50,
    right: 30,
    backgroundColor: 'black',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalSubTitle: {
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: 200,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
  modalButton: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    width: 100,
    alignItems: 'center',
  },
  buttonSalvar: {
    backgroundColor: 'black',
  },
  buttonCancelar: {
    backgroundColor: 'gray',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  editedLabel: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
    alignSelf: 'flex-end',
    fontWeight: 'bold',
  }
});
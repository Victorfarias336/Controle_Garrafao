import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function GraficosPage() {
  const [vendas, setVendas] = useState([]);
  const [dadosGraficoBarra, setDadosGraficoBarra] = useState([]);
  const [totalVendas, setTotalVendas] = useState(0);
  const [dadosGraficoLucro, setDadosGraficoLucro] = useState([]);
  const [dadosGraficoLinha, setDadosGraficoLinha] = useState([]);

  useFocusEffect(
      React.useCallback(() => {
        carregarVendas();
      }, [])
    );

  useEffect(() => {
    if (vendas.length > 0) {
      processarDadosParaGraficos();
    } else {
      setTotalVendas(0);
      setDadosGraficoBarra([]);
    }
  }, [vendas]);

  const carregarVendas = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('vendas');
      if (jsonValue != null) {
        const vendasArmazenadas = JSON.parse(jsonValue);
        setVendas(vendasArmazenadas);
      }
    } catch (e) {
      console.error('Erro ao carregar vendas:', e);
    }
  };

  const processarDadosParaGraficos = () => {
    // 1. Calcular o Total de Vendas
    const total = vendas.reduce((sum, venda) => sum + venda.valor, 0);
    setTotalVendas(total);

    // 2. Processar dados para o gráfico de barras (Agua mais vendida por Quant.)
    const aguasMap = vendas.reduce((map, venda) => {
      const nomeAgua = venda.agua;
      const quantidade = venda.quantidade || 0;
      map[nomeAgua] = (map[nomeAgua] || 0) + quantidade;
      return map;
    }, {});

    const topAguas = Object.entries(aguasMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Formata os dados para o Gráfico de Quant.
    const dadosFormatadosQT = topAguas.map(([nome, quantidade]) => ({
      value: quantidade,
      label: nome,
      frontColor: '#007AFF',
    }));
    setDadosGraficoBarra(dadosFormatadosQT);

    // 3. Processar dados para o gráfico de valor (Agua que gerou mais valor em R$)
    const lucroMap = vendas.reduce((map, venda) => {
        const nomeAgua = venda.agua;
        const valor = venda.valor || 0;
        map[nomeAgua] = (map[nomeAgua] || 0) + valor;
        return map;
    }, {});

    const topLucro = Object.entries(lucroMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Formata os dados para o Gráfico de Valor
    const dadosLucroFormatados = topLucro.map(([nome, valor]) => ({
      value: valor,
      label: nome,
      frontColor: '#FF6347',
    }));
    setDadosGraficoLucro(dadosLucroFormatados);

     // 4. Processar dados para o gráfico de linha (Valor total por mês)
        const mesesMap = {};
        vendas.forEach(venda => {
            // Extrai o mês da data (ex: '09' de '15/09/2025')
            const mes = venda.data.split('/')[1];
            mesesMap[mes] = (mesesMap[mes] || 0) + venda.valor;
        });

        // Mapeia os dados para o formato do LineChart
        const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const dadosLineChart = nomesMeses.map((nome, index) => {
            // Converte o índice do mês para string (ex: 1 -> '01')
            const mesNumerico = (index + 1).toString().padStart(2, '0');
            const valorDoMes = mesesMap[mesNumerico] || 0;
            return {
                value: valorDoMes,
                label: nome,
            };
        });

        setDadosGraficoLinha(dadosLineChart);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Cartão de Total de Vendas */}
      <View style={styles.cardContainer}>
        <Text style={styles.cardTitle}>Total de Vendas</Text>
        <Text style={styles.totalValue}>
          R$ {(typeof totalVendas === 'number' ? totalVendas : 0).toFixed(2).replace('.', ',')}
        </Text>
      </View>

      {/* Gráfico de Barras - Agua mais vendida */}
      <View style={styles.graficoContainer}>
              <Text style={styles.subTitulo}>Agua mais vendida (Quant.)</Text>
              {vendas.length > 0 && dadosGraficoBarra.length > 0 ? (
                <BarChart
                  width={250}
                  data={dadosGraficoBarra}
                  horizontal
                  barWidth={20}
                  spacing={20}
                  hideAxesAndRules
                  barBorderRadius={5}
                  xAxisLabelTextStyle={{ fontSize: 12, fontWeight: 'bold', }}
                  xAxisLabelsVerticalShift={30}
                />
              ) : (
                <Text style={styles.semDadosTexto}>Nenhum dado de vendas para exibir o gráfico.</Text>
              )}
            </View>

      <View style={styles.graficoContainer}>
              <Text style={styles.subTitulo}>Agua que gerou mais valor (R$)</Text>
              {vendas.length > 0 && dadosGraficoLucro.length > 0 ? (
                <BarChart
                  width={250}
                  data={dadosGraficoLucro}
                  horizontal
                  barWidth={20}
                  spacing={20}
                  hideAxesAndRules
                  barBorderRadius={5}
                  xAxisLabelTextStyle={{ fontSize: 12, fontWeight: 'bold' }}
                  xAxisLabelsVerticalShift={30}
                />
              ) : (
                <Text style={styles.semDadosTexto}>Nenhum dado de valor para exibir o gráfico.</Text>
              )}
            </View>

       {/* --- Gráfico de Linha: Valor por Mês --- */}
            <View style={styles.graficoContainer}>
              <Text style={styles.subTitulo}>Valor por mês</Text>
              {vendas.length > 0 && dadosGraficoLinha.length > 0 ? (
                <LineChart
                  data={dadosGraficoLinha}
                  dataPointsColor={'lightgreen'} // Cor dos pontos na linha
                  color={'lightgreen'} // Cor da linha
                  dataPointsShape={'circle'} // Formato dos pontos
                  spacing={30} // Espaçamento entre os pontos no eixo X
                  // Estilo do rótulo do eixo X para girar os nomes dos meses
                  xAxisLabelTextStyle={{ fontSize: 12, fontWeight: 'bold', transform: [{ rotate: '-45deg' }] }}
                  xAxisLabelsVerticalShift={30} // Deslocamento vertical para evitar sobreposição
                  noOfSections={7} // Número de seções no eixo Y
                  //hideDataPoints
                  showXAxisIndices={false}
                  hideRules
                  hideOrigin
                  showVerticalLines
                  curved
                  //yAxisColor="transparent"
                  //xAxisColor="transparent"
                  hideAxesAndRules
                  hideYAxisText
                  yAxisExtraHeight={80}
                  xAxisLabelsVerticalShift={7}
                  showValuesAsDataPointsText={true}
                  textColor="gray"
                  textFontSize={10}
                  textShiftY={-1}
                  textShiftX={9}
                  pointerConfig={{
                              pointerStripHeight: 160,
                              pointerStripColor: 'lightgray',
                              pointerStripWidth: 2,
                              pointerColor: 'lightgray',
                              radius: 6,
                              pointerLabelWidth: 100,
                              pointerLabelHeight: 90,
                              activatePointersOnLongPress: true,
                              autoAdjustPointerLabelPosition: false,
                              pointerLabelComponent: items => {
                                return (
                                  <View
                                    style={{
                                      height: 90,
                                      width: 110,
                                      justifyContent: 'center',
                                      marginTop: -30,
                                      marginLeft: -40,
                                    }}>
                                    <Text style={{color: 'white', fontSize: 14, marginBottom:6,textAlign:'center'}}>
                                      {items[0].date}
                                    </Text>

                                    <View style={{paddingHorizontal:14,paddingVertical:6, borderRadius:16, backgroundColor:'white'}}>
                                      <Text style={{fontWeight: 'bold',textAlign:'center'}}>
                                        {'$' + items[0].value}
                                      </Text>
                                    </View>
                                  </View>
                                );
                              },
                            }}
                />
              ) : (
                <Text style={styles.semDadosTexto}>Nenhum dado para exibir o gráfico de valor mensal.</Text>
              )}
            </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  graficoContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 20,
    elevation: 3,
  },
  subTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: -40,
    textAlign: 'center',
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: 'gray',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 5,
  },
  semDadosTexto: {
    textAlign: 'center',
    padding: 20,
    color: 'gray',
  },
});
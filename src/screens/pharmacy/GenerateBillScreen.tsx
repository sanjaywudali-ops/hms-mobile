import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useForm, Controller} from 'react-hook-form';
import RNPickerSelect from 'react-native-picker-select';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS, FONTS, SPACING, RADIUS} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {ScreenHeader, FormInput, Button, Card} from '../../components/common';

interface BillItem {id: string; medicineName: string; quantity: number; unitPrice: number}

export default function GenerateBillScreen({navigation}: any) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<BillItem[]>([]);
  const [newItem, setNewItem] = useState({medicineName: '', quantity: '1', unitPrice: ''});
  const [selectedPatientId, setSelectedPatientId] = useState('');

  const {data: patients} = useQuery({
    queryKey: ['common-patients'],
    queryFn: async () => (await instance.get(api.getAllCommonPatients)).data.data,
  });

  const patientItems = (patients || []).map((p: any) => ({
    label: `${p.user?.fName} ${p.user?.lName} (${p.patientCode})`,
    value: p.id,
  }));

  const addItem = () => {
    if (!newItem.medicineName || !newItem.unitPrice) return;
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      medicineName: newItem.medicineName,
      quantity: parseInt(newItem.quantity) || 1,
      unitPrice: parseFloat(newItem.unitPrice) || 0,
    }]);
    setNewItem({medicineName: '', quantity: '1', unitPrice: ''});
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const mutation = useMutation({
    mutationFn: () => instance.post(api.createPharmacyBill, {
      patientId: selectedPatientId,
      items: items.map(i => ({medicineName: i.medicineName, quantity: i.quantity, unitPrice: i.unitPrice})),
      subtotal, totalAmount: subtotal,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['pharmacy-bills']});
      Toast.show({type: 'success', text1: 'Bill Generated', text2: 'Pharmacy bill created successfully.'});
      navigation.goBack();
    },
    onError: (err: any) => {
      Toast.show({type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed to generate bill'});
    },
  });

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Generate Bill" navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Patient */}
        <Card style={{margin: SPACING.base}}>
          <Text style={styles.sectionTitle}>Patient</Text>
          <View style={styles.pickerWrap}>
            <RNPickerSelect
              onValueChange={setSelectedPatientId}
              value={selectedPatientId}
              items={patientItems}
              placeholder={{label: 'Select patient...', value: ''}}
              style={{inputIOS: styles.pickerInput, inputAndroid: styles.pickerInput}}
            />
          </View>
        </Card>

        {/* Add Item */}
        <Card style={{marginHorizontal: SPACING.base}}>
          <Text style={styles.sectionTitle}>Add Medicine / Item</Text>
          <FormInput label="Medicine Name" value={newItem.medicineName}
            onChangeText={v => setNewItem(p => ({...p, medicineName: v}))}
            placeholder="Enter medicine name" />
          <View style={styles.row}>
            <View style={{flex: 1}}>
              <FormInput label="Quantity" value={newItem.quantity}
                onChangeText={v => setNewItem(p => ({...p, quantity: v}))}
                keyboardType="numeric" placeholder="1" />
            </View>
            <View style={{flex: 1}}>
              <FormInput label="Unit Price (₹)" value={newItem.unitPrice}
                onChangeText={v => setNewItem(p => ({...p, unitPrice: v}))}
                keyboardType="numeric" placeholder="0.00" />
            </View>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={addItem}>
            <Icon name="plus" size={16} color={COLORS.white} />
            <Text style={styles.addBtnText}>Add Item</Text>
          </TouchableOpacity>
        </Card>

        {/* Items List */}
        {items.length > 0 && (
          <Card style={{marginHorizontal: SPACING.base}}>
            <Text style={styles.sectionTitle}>Bill Items</Text>
            {items.map((item, idx) => (
              <View key={item.id} style={[styles.lineItem, idx < items.length - 1 && styles.lineItemBorder]}>
                <View style={{flex: 1}}>
                  <Text style={styles.itemName}>{item.medicineName}</Text>
                  <Text style={styles.itemMeta}>{item.quantity} × ₹{item.unitPrice}</Text>
                </View>
                <Text style={styles.itemTotal}>₹{(item.quantity * item.unitPrice).toLocaleString()}</Text>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={{marginLeft: SPACING.sm}}>
                  <Icon name="close-circle" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{subtotal.toLocaleString()}</Text>
            </View>
          </Card>
        )}

        <Button
          label="Generate Bill"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={items.length === 0 || !selectedPatientId}
          fullWidth
          style={{margin: SPACING.base}}
          icon="receipt"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  scroll: {paddingBottom: SPACING.xxxl},
  sectionTitle: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text, marginBottom: SPACING.sm},
  pickerWrap: {borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, backgroundColor: COLORS.white, paddingHorizontal: SPACING.sm},
  pickerInput: {fontSize: FONTS.sizes.base, color: COLORS.text, paddingVertical: SPACING.sm + 2},
  row: {flexDirection: 'row', gap: SPACING.sm},
  addBtn: {flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: COLORS.primary, padding: SPACING.sm, borderRadius: RADIUS.md, justifyContent: 'center'},
  addBtnText: {color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold},
  lineItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm},
  lineItemBorder: {borderBottomWidth: 1, borderBottomColor: COLORS.borderLight},
  itemName: {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.text},
  itemMeta: {fontSize: FONTS.sizes.xs, color: COLORS.textSecondary},
  itemTotal: {fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.text},
  divider: {height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm},
  totalRow: {flexDirection: 'row', justifyContent: 'space-between'},
  totalLabel: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text},
  totalValue: {fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.orange},
});

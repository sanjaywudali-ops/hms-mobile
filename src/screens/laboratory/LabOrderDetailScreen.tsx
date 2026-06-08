import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useForm, Controller} from 'react-hook-form';
import Toast from 'react-native-toast-message';
import {format} from 'date-fns';
import {COLORS, FONTS, SPACING} from '../../constants/theme';
import {api} from '../../constants/api';
import {instance} from '../../services/axios';
import {ScreenHeader, Badge, Card, InfoRow, FormInput, Button, LoadingScreen} from '../../components/common';

export default function LabOrderDetailScreen({route, navigation}: any) {
  const {id} = route.params;
  const queryClient = useQueryClient();

  const {data, isLoading} = useQuery({
    queryKey: ['lab-order', id],
    queryFn: async () => (await instance.get(api.getLabOrderById(id))).data.data,
  });

  const {control, handleSubmit} = useForm({
    defaultValues: {result: '', remarks: '', referenceRange: ''},
  });

  const submitMutation = useMutation({
    mutationFn: (formData: any) =>
      instance.patch(api.updateLabOrder(id), {...formData, status: 'COMPLETED'}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['lab-order', id]});
      queryClient.invalidateQueries({queryKey: ['lab-orders']});
      Toast.show({type: 'success', text1: 'Results Submitted'});
    },
    onError: (err: any) => {
      Toast.show({type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed'});
    },
  });

  if (isLoading || !data) return <LoadingScreen message="Loading order..." />;

  const statusVariant = (s: string) => ({PENDING: 'planned', IN_PROGRESS: 'inProgress', COMPLETED: 'completed', CANCELLED: 'cancelled'}[s] || 'default') as any;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Lab Order Details" navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.hero}>
          <Text style={styles.testName}>{data.testName}</Text>
          <Badge label={data.status} variant={statusVariant(data.status)} />
        </View>

        <Card style={{margin: SPACING.base}}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <InfoRow label="Ordered By" value={data.orderedBy?.user ? `Dr. ${data.orderedBy.user.fName} ${data.orderedBy.user.lName}` : '—'} icon="stethoscope" />
          <InfoRow label="Patient" value={data.patient?.user ? `${data.patient.user.fName} ${data.patient.user.lName}` : '—'} icon="account-outline" />
          <InfoRow label="Date" value={data.createdAt ? format(new Date(data.createdAt), 'dd MMM yyyy, hh:mm a') : '—'} icon="calendar" />
          <InfoRow label="Priority" value={data.priority || '—'} icon="alert-circle-outline" />
          {data.notes && <InfoRow label="Notes" value={data.notes} icon="note-outline" />}
        </Card>

        {data.status === 'COMPLETED' && data.result ? (
          <Card style={{marginHorizontal: SPACING.base}}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            <InfoRow label="Result" value={data.result} icon="flask-outline" />
            {data.referenceRange && <InfoRow label="Reference Range" value={data.referenceRange} icon="chart-line-variant" />}
            {data.remarks && <InfoRow label="Remarks" value={data.remarks} icon="comment-outline" />}
          </Card>
        ) : data.status === 'IN_PROGRESS' ? (
          <Card style={{marginHorizontal: SPACING.base}}>
            <Text style={styles.sectionTitle}>Enter Results</Text>
            <Controller control={control} name="result"
              render={({field: {onChange, value}}) => (
                <FormInput label="Result" value={value} onChangeText={onChange} placeholder="Enter test result..." multiline numberOfLines={3} required />
              )} />
            <Controller control={control} name="referenceRange"
              render={({field: {onChange, value}}) => (
                <FormInput label="Reference Range" value={value} onChangeText={onChange} placeholder="e.g. 70-100 mg/dL" />
              )} />
            <Controller control={control} name="remarks"
              render={({field: {onChange, value}}) => (
                <FormInput label="Remarks" value={value} onChangeText={onChange} placeholder="Additional remarks..." multiline numberOfLines={2} />
              )} />
            <Button label="Submit Results" onPress={handleSubmit(d => submitMutation.mutate(d))} loading={submitMutation.isPending} fullWidth icon="check-circle-outline" />
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  scroll: {paddingBottom: SPACING.xxxl},
  hero: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.base, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  testName: {fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.text},
  sectionTitle: {fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.text, marginBottom: SPACING.sm},
});

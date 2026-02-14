import { View, Text, StyleSheet } from 'react-native';
import { useMyProfile, useUpdateProfile, useSignOut } from '../hooks/useProfile';
import { Button, Input, FormField } from '../../../components/ui';
import { useState, useEffect } from 'react';

export function ProfileView() {
  const { data: profile, isLoading } = useMyProfile();
  const updateMutation = useUpdateProfile();
  const signOut = useSignOut();

  const [name, setName] = useState('');

  useEffect(() => {
    if (profile) setName(profile.full_name);
  }, [profile]);

  if (isLoading) return <Text style={{padding: 20}}>Loading...</Text>;

  return (
     <View style={styles.container}>
        <Text style={styles.header}>Profile</Text>
        <FormField label="Full Name">
             <Input value={name} onChangeText={setName} />
        </FormField>
        <View style={styles.spacer} />
        <Button 
            label="Save Changes" 
            onPress={() => updateMutation.mutate({ full_name: name })} 
            loading={updateMutation.isPending} 
        />
        <View style={styles.spacer} />
        <Button label="Sign Out" variant="secondary" onPress={signOut} />
     </View>
  );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    spacer: {
        height: 20,
    }
});

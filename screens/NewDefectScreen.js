import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../supabase";

// PRIORITY DEFINITIONS
const PRIORITIES = [
  {
    id: "1",
    label: "1 – Dangerous",
    desc: "Work must be STOPPED immediately",
    color: "#ff4d4d",
  },
  {
    id: "2",
    label: "2 – Major",
    desc: "Repair needed same shift",
    color: "#ff944d",
  },
  {
    id: "3",
    label: "3 – Routine",
    desc: "Repair within 2–3 days",
    color: "#ffd24d",
  },
  {
    id: "4",
    label: "4 – Minor",
    desc: "Repair within 1–2 weeks",
    color: "#4da6ff",
  },
  {
    id: "5",
    label: "5 – Cosmetic",
    desc: "Repair when convenient",
    color: "#d9d9d9",
  },
];

export default function NewDefectScreen({ navigation }) {
  const [asset, setAsset] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [photos, setPhotos] = useState([]);

  // PICK FROM GALLERY
  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return alert("Gallery permission required.");

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) setPhotos([...photos, result.assets[0].uri]);
  }

  // TAKE PHOTO
  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return alert("Camera permission required.");

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) setPhotos([...photos, result.assets[0].uri]);
  }

  // UPLOAD PHOTOS
  async function uploadPhotos(defectId) {
    const uploaded = [];

    for (let i = 0; i < photos.length; i++) {
      const uri = photos[i];
      const fileName = `${defectId}_${Date.now()}_${i}.jpg`;

      const res = await fetch(uri);
      const blob = await res.blob();

      const { error } = await supabase.storage
        .from("defect-photos")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
        });

      if (!error) {
        const { data: signed } = await supabase.storage
          .from("defect-photos")
          .createSignedUrl(fileName, 60 * 60 * 24 * 365);

        uploaded.push(signed.signedUrl);
      }
    }

    return uploaded;
  }

  // SUBMIT DEFECT
  async function submitDefect() {
    if (!asset) return alert("Please select an asset.");
    if (!title.trim()) return alert("Please enter a title.");
    if (!description.trim()) return alert("Please enter a description.");
    if (!priority) return alert("Please select a priority.");
    if (!category) return alert("Please select a category.");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. INSERT DEFECT WITH status="Reported"
    const { data, error } = await supabase
      .from("defects")
      .insert([
        {
          asset,
          title,
          description,
          priority: Number(priority),
          category,
          submitted_by: user?.email ?? "Unknown",
          created_by: user?.id ?? null,
          status: "Reported", // always red to start
        },
      ])
      .select()
      .single();

    if (error) return alert(error.message);

    const defectId = data.id;

    // 2. UPLOAD PHOTOS IF ANY
    if (photos.length > 0) {
      const urls = await uploadPhotos(defectId);

      await supabase
        .from("defects")
        .update({ photo_urls: urls })
        .eq("id", defectId);
    }

    alert("Defect submitted!");
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>New Defect Report</Text>

        {/* ASSET PICKER */}
        <Text style={styles.label}>Select Asset:</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={asset} onValueChange={setAsset}>
            <Picker.Item label="-- Select Asset --" value="" />
            <Picker.Item label="BX22" value="BX22" />
            <Picker.Item label="BX33" value="BX33" />
            <Picker.Item label="BX64" value="BX64" />
            <Picker.Item label="MM2" value="MM2" />
            <Picker.Item label="MM3" value="MM3" />
            <Picker.Item label="RMX1" value="RMX1" />
            <Picker.Item label="FOAM MIX PLANT" value="FOAM MIX PLANT" />
            <Picker.Item label="TWIN SILO" value="TWIN SILO" />
            <Picker.Item label="CEMENT TANKER" value="CEMENT TANKER" />
          </Picker>
        </View>

        {/* TITLE */}
        <TextInput
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />

        {/* DESCRIPTION */}
        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          style={styles.textarea}
          multiline
        />

        {/* PRIORITY */}
        <Text style={styles.label}>Select Priority:</Text>
        <View>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setPriority(p.id)}
              style={[
                styles.priorityCard,
                {
                  borderColor: priority === p.id ? p.color : "#ccc",
                  backgroundColor:
                    priority === p.id ? p.color + "22" : "#f3f3f3",
                },
              ]}
            >
              <Text style={[styles.priorityTitle, { color: p.color }]}>
                {p.label}
              </Text>
              <Text style={styles.priorityDesc}>{p.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CATEGORY PICKER */}
        <Text style={styles.label}>Select Defect Category:</Text>
        <View style={styles.pickerWrapperFixed}>
          <Picker selectedValue={category} onValueChange={setCategory}>
            <Picker.Item label="-- Select Category --" value="" />
            <Picker.Item label="Health and Safety" value="Health and Safety" />
            <Picker.Item label="Environmental" value="Environmental" />
            <Picker.Item label="Quality" value="Quality" />
          </Picker>
        </View>

        {/* PHOTO BUTTONS */}
        <Text style={styles.label}>Photos:</Text>
        <View style={styles.photoButtonsRow}>
          <TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
            <Text style={styles.photoButtonText}>📁 Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
            <Text style={styles.photoButtonText}>📷 Camera</Text>
          </TouchableOpacity>
        </View>

        {/* PHOTO PREVIEW */}
        <View style={styles.photoPreviewContainer}>
          {photos.map((uri, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image source={{ uri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.deletePhotoButton}
                onPress={() =>
                  setPhotos(photos.filter((_, i) => i !== index))
                }
              >
                <Text style={styles.deletePhotoText}>✖</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* SUBMIT BUTTON */}
        <Button title="Submit Defect" onPress={submitDefect} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------
// STYLES
// ---------------------------
const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 100 },

  header: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },

  label: {
    marginTop: 15,
    marginBottom: 8,
    fontSize: 20,
    fontWeight: "600",
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
  },

  pickerWrapperFixed: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
    overflow: "hidden", // REQUIRED TO FIX PICKER TOUCHES
  },

  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },

  textarea: {
    padding: 12,
    height: 100,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },

  priorityCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    marginBottom: 12,
  },

  priorityTitle: { fontSize: 18, fontWeight: "700" },
  priorityDesc: { fontSize: 14, color: "#444" },

  photoButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  photoButton: {
    backgroundColor: "#e6e6e6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  photoButtonText: { fontSize: 16, fontWeight: "600" },

  photoPreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },

  photoWrapper: { position: "relative", marginRight: 10, marginBottom: 10 },

  photo: { width: 100, height: 100, borderRadius: 8 },

  deletePhotoButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "red",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  deletePhotoText: { color: "white", fontWeight: "bold", fontSize: 16 },
});

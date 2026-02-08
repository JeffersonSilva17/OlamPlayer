package com.olamplayer.saf

import android.content.Intent
import android.net.Uri
import androidx.documentfile.provider.DocumentFile
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import android.webkit.MimeTypeMap
import java.io.File
import java.io.FileOutputStream
import java.util.Locale
import java.util.concurrent.Executors

class AndroidSafModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val executor = Executors.newSingleThreadExecutor()

  override fun getName(): String = "AndroidSaf"

  @ReactMethod
  fun takePersistablePermission(uriString: String, promise: Promise) {
    try {
      val uri = Uri.parse(uriString)
      val flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or
        Intent.FLAG_GRANT_WRITE_URI_PERMISSION
      reactApplicationContext.contentResolver.takePersistableUriPermission(uri, flags)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("saf_permission_error", e)
    }
  }

  @ReactMethod
  fun indexFolderTree(uriString: String, ignorePatterns: ReadableArray?, promise: Promise) {
    executor.execute {
      try {
        val uri = Uri.parse(uriString)
        val root = DocumentFile.fromTreeUri(reactApplicationContext, uri)
        if (root == null || !root.isDirectory) {
          promise.reject("saf_invalid_tree", "Invalid tree URI")
          return@execute
        }

        val patterns = mutableListOf<String>()
        if (ignorePatterns != null) {
          for (i in 0 until ignorePatterns.size()) {
            patterns.add(ignorePatterns.getString(i)?.lowercase(Locale.getDefault()) ?: "")
          }
        }

        val results = Arguments.createArray()
        val queue: ArrayDeque<DocumentFile> = ArrayDeque()
        queue.add(root)

        while (queue.isNotEmpty()) {
          val current = queue.removeFirst()
          if (current.isDirectory) {
            val name = (current.name ?: "").lowercase(Locale.getDefault())
            if (patterns.any { it.isNotEmpty() && name.contains(it) }) {
              continue
            }
            for (child in current.listFiles()) {
              queue.add(child)
            }
          } else if (current.isFile) {
            val mimeType = current.type ?: ""
            if (mimeType.startsWith("audio/") || mimeType.startsWith("video/")) {
              val map = Arguments.createMap()
              map.putString("uri", current.uri.toString())
              map.putString("displayName", current.name)
              map.putString("mimeType", current.type)
              map.putDouble("sizeBytes", current.length().toDouble())
              map.putDouble("lastModified", current.lastModified().toDouble())
              results.pushMap(map)
            }
          }
        }

        promise.resolve(results)
      } catch (e: Exception) {
        promise.reject("saf_index_error", e)
      }
    }
  }

  @ReactMethod
  fun copyToCache(uriString: String, fileName: String?, promise: Promise) {
    executor.execute {
      try {
        val uri = Uri.parse(uriString)
        val resolver = reactApplicationContext.contentResolver
        val guessedName = fileName ?: DocumentFile.fromSingleUri(reactApplicationContext, uri)?.name
        val safeName = (guessedName ?: "arquivo").replace(Regex("[\\\\/:*?\"<>|]"), "_")
        val mimeType = resolver.getType(uri)
        val extension = if (mimeType != null) MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType) else null
        val finalName = if (safeName.contains(".") || extension == null) safeName else "$safeName.$extension"
        val cacheDir = File(reactApplicationContext.cacheDir, "share")
        if (!cacheDir.exists()) {
          cacheDir.mkdirs()
        }
        val target = File(cacheDir, "${System.currentTimeMillis()}-$finalName")
        resolver.openInputStream(uri)?.use { input ->
          FileOutputStream(target).use { output ->
            input.copyTo(output)
          }
        } ?: run {
          promise.reject("saf_copy_error", "Unable to open input stream")
          return@execute
        }
        promise.resolve("file://${target.absolutePath}")
      } catch (e: Exception) {
        promise.reject("saf_copy_error", e)
      }
    }
  }
}

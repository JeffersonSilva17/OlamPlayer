import Foundation
import React
import UniformTypeIdentifiers
import MobileCoreServices

@objc(OpenFileModule)
class OpenFileModule: RCTEventEmitter {
  private static var shared: OpenFileModule?
  private static var hasListeners = false
  private static var pendingFiles: [[String: Any]] = []

  override init() {
    super.init()
    OpenFileModule.shared = self
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func supportedEvents() -> [String]! {
    return ["OlamPlayerOpenFile"]
  }

  override func startObserving() {
    OpenFileModule.hasListeners = true
    flushPendingIfNeeded()
  }

  override func stopObserving() {
    OpenFileModule.hasListeners = false
  }

  @objc
  func getPendingFiles(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(OpenFileModule.pendingFiles)
    OpenFileModule.pendingFiles.removeAll()
  }

  @objc
  static func handleOpenUrl(_ url: URL) {
    let file = buildFilePayload(from: url)
    if hasListeners, let emitter = shared {
      emitter.sendEvent(withName: "OlamPlayerOpenFile", body: ["files": [file]])
    } else {
      pendingFiles.append(file)
    }
  }

  private func flushPendingIfNeeded() {
    guard OpenFileModule.pendingFiles.count > 0 else { return }
    sendEvent(withName: "OlamPlayerOpenFile", body: ["files": OpenFileModule.pendingFiles])
    OpenFileModule.pendingFiles.removeAll()
  }

  private static func buildFilePayload(from url: URL) -> [String: Any] {
    var size: NSNumber? = nil
    let accessed = url.startAccessingSecurityScopedResource()
    if let attrs = try? FileManager.default.attributesOfItem(atPath: url.path),
       let fileSize = attrs[.size] as? NSNumber {
      size = fileSize
    }
    if accessed {
      url.stopAccessingSecurityScopedResource()
    }

    var mimeType: String? = nil
    if let ext = url.pathExtension.isEmpty ? nil : url.pathExtension {
      if #available(iOS 14.0, *) {
        if let type = UTType(filenameExtension: ext) {
          mimeType = type.preferredMIMEType
        }
      } else {
        if let utiRef = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, ext as CFString, nil) {
          let uti = utiRef.takeRetainedValue()
          if let mimeRef = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassMIMEType) {
            mimeType = mimeRef.takeRetainedValue() as String
          }
        }
      }
    }

    return [
      "uri": url.absoluteString,
      "displayName": url.lastPathComponent,
      "mimeType": mimeType as Any,
      "sizeBytes": size as Any,
    ]
  }
}

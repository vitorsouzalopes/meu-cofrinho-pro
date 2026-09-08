package com.meucofrinho.app;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "NotificationPermission",
    permissions = {
        @Permission(
            alias = "notifications",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
public class NotificationPermissionPlugin extends Plugin {

    @PluginMethod
    public void checkStatus(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            ret.put("status", "granted");
        } else {
            int result = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS);
            if (result == PackageManager.PERMISSION_GRANTED) {
                ret.put("status", "granted");
            } else {
                ret.put("status", "prompt");
            }
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JSObject ret = new JSObject();
            ret.put("status", "granted");
            call.resolve(ret);
        } else {
            requestPermissionForAlias("notifications", call, "permissionCallback");
        }
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject ret = new JSObject();
        int result = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS);
        if (result == PackageManager.PERMISSION_GRANTED) {
            ret.put("status", "granted");
        } else {
            ret.put("status", "denied");
        }
        call.resolve(ret);
    }
}

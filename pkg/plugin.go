package main

import (
	"net/http"
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
)

const pluginID = "grafana-marketplace-app"

func main() {
	backend.SetupPluginEnvironment(pluginID)

	logger := log.New()

	srv := &server{
		logger: logger,
	}

	mux := http.NewServeMux()

	srv.registerRoutes(mux)

	resourceHandler := httpadapter.New(mux)

	err := backend.Serve(backend.ServeOpts{
		CallResourceHandler: resourceHandler,
	})

	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}
}
